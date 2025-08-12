/**
 * Performance monitoring utility for availability API optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pastDateSkips: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      computationSaved: 0,
    };
  }

  /**
   * Track when a past date is skipped to save computation
   */
  trackPastDateSkip() {
    this.metrics.pastDateSkips++;
    this.metrics.computationSaved++;
  }

  /**
   * Track total requests
   */
  trackRequest(responseTime) {
    this.metrics.totalRequests++;

    // Calculate rolling average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) +
        responseTime) /
      this.metrics.totalRequests;
  }

  /**
   * Track cache hits
   */
  trackCacheHit() {
    this.metrics.cacheHits++;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const computationSavingPercentage =
      this.metrics.totalRequests > 0
        ? (
            (this.metrics.computationSaved / this.metrics.totalRequests) *
            100
          ).toFixed(2)
        : 0;

    return {
      ...this.metrics,
      computationSavingPercentage: `${computationSavingPercentage}%`,
      cacheHitRate:
        this.metrics.totalRequests > 0
          ? `${(
              (this.metrics.cacheHits / this.metrics.totalRequests) *
              100
            ).toFixed(2)}%`
          : "0%",
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      pastDateSkips: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      computationSaved: 0,
    };
  }

  /**
   * Log performance summary
   */
  logSummary() {
    const metrics = this.getMetrics();
    console.log("📊 Availability API Performance Metrics:");
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Past Date Skips: ${metrics.pastDateSkips}`);
    console.log(`   Computation Saved: ${metrics.computationSavingPercentage}`);
    console.log(`   Cache Hit Rate: ${metrics.cacheHitRate}`);
    console.log(
      `   Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`
    );
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
