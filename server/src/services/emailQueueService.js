import logger from "../utils/logger.js";
import emailService from "./emailService.js";

/**
 * Email Queue Service for reliable email delivery
 * Implements retry mechanism and queue management for email notifications
 */
class EmailQueueService {
  constructor() {
    this.queue = new Map();
    this.processing = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    this.maxRetryDelay = 60000; // 1 minute
    this.processInterval = null;

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Add email to queue for processing
   */
  async queueEmail(emailData, priority = "normal") {
    const queueId = this.generateQueueId();
    const queueItem = {
      id: queueId,
      emailData,
      priority,
      attempts: 0,
      maxAttempts: this.retryAttempts,
      createdAt: new Date(),
      scheduledFor: new Date(),
      status: "queued",
    };

    this.queue.set(queueId, queueItem);

    logger.info("Email queued for delivery", {
      queueId,
      to: emailData.to,
      subject: emailData.subject,
      priority,
    });

    return queueId;
  }

  /**
   * Process email queue
   */
  async processQueue() {
    if (this.processing) return;

    this.processing = true;
    const now = new Date();

    try {
      // Get items ready for processing, sorted by priority and creation time
      const readyItems = Array.from(this.queue.values())
        .filter((item) => item.status === "queued" && item.scheduledFor <= now)
        .sort((a, b) => {
          // High priority first, then by creation time
          if (a.priority === "high" && b.priority !== "high") return -1;
          if (b.priority === "high" && a.priority !== "high") return 1;
          return a.createdAt - b.createdAt;
        });

      for (const item of readyItems) {
        await this.processQueueItem(item);
      }
    } catch (error) {
      logger.error("Error processing email queue", error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(item) {
    try {
      item.status = "processing";
      item.attempts++;

      await emailService.sendEmail(item.emailData);

      // Success - remove from queue
      this.queue.delete(item.id);

      logger.info("Email sent successfully from queue", {
        queueId: item.id,
        to: item.emailData.to,
        attempts: item.attempts,
      });
    } catch (error) {
      logger.error("Failed to send email from queue", {
        queueId: item.id,
        to: item.emailData.to,
        attempts: item.attempts,
        error: error.message,
      });

      if (item.attempts >= item.maxAttempts) {
        // Max attempts reached - mark as failed
        item.status = "failed";
        item.failedAt = new Date();

        logger.error("Email permanently failed after max attempts", {
          queueId: item.id,
          to: item.emailData.to,
          attempts: item.attempts,
        });
      } else {
        // Schedule for retry with exponential backoff
        const delay = Math.min(
          this.retryDelay * Math.pow(2, item.attempts - 1),
          this.maxRetryDelay
        );

        item.status = "queued";
        item.scheduledFor = new Date(Date.now() + delay);

        logger.info("Email scheduled for retry", {
          queueId: item.id,
          to: item.emailData.to,
          attempts: item.attempts,
          retryIn: delay,
        });
      }
    }
  }

  /**
   * Start queue processing
   */
  startProcessing() {
    if (this.processInterval) return;

    this.processInterval = setInterval(() => {
      this.processQueue();
    }, 10000); // Process every 10 seconds

    logger.info("Email queue processing started");
  }

  /**
   * Stop queue processing
   */
  stopProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      logger.info("Email queue processing stopped");
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const items = Array.from(this.queue.values());
    return {
      total: items.length,
      queued: items.filter((item) => item.status === "queued").length,
      processing: items.filter((item) => item.status === "processing").length,
      failed: items.filter((item) => item.status === "failed").length,
      oldestItem:
        items.length > 0
          ? Math.min(...items.map((item) => item.createdAt))
          : null,
    };
  }

  /**
   * Clear failed items from queue
   */
  clearFailedItems() {
    const failedItems = Array.from(this.queue.entries()).filter(
      ([_, item]) => item.status === "failed"
    );

    failedItems.forEach(([id, _]) => this.queue.delete(id));

    logger.info(`Cleared ${failedItems.length} failed email items from queue`);
    return failedItems.length;
  }

  /**
   * Generate unique queue ID
   */
  generateQueueId() {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retry failed item
   */
  async retryFailedItem(queueId) {
    const item = this.queue.get(queueId);
    if (!item || item.status !== "failed") {
      throw new Error("Queue item not found or not in failed state");
    }

    item.status = "queued";
    item.attempts = 0;
    item.scheduledFor = new Date();

    logger.info("Failed email item queued for retry", { queueId });
    return true;
  }
}

export const emailQueueService = new EmailQueueService();
export default emailQueueService;
