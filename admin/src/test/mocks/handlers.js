import { http, HttpResponse } from "msw";

const API_BASE_URL = "http://localhost:5000/api";

export const handlers = [
  // Admin auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: "1",
          name: "Admin User",
          phone: "9876543210",
          email: "admin@example.com",
          role: "admin",
        },
        token: "mock-admin-jwt-token",
      },
    });
  }),

  // Users management endpoints
  http.get(`${API_BASE_URL}/admin/users`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        users: [
          {
            _id: "1",
            name: "John Doe",
            phone: "9876543210",
            email: "john@example.com",
            subscription: {
              planId: "1",
              sessionsRemaining: 5,
              totalSessions: 6,
              status: "active",
            },
            createdAt: "2024-01-01T00:00:00.000Z",
          },
          {
            _id: "2",
            name: "Jane Smith",
            phone: "9876543211",
            email: "jane@example.com",
            subscription: {
              planId: "2",
              sessionsRemaining: 7,
              totalSessions: 8,
              status: "active",
            },
            createdAt: "2024-01-02T00:00:00.000Z",
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 2,
        },
      },
    });
  }),

  http.get(`${API_BASE_URL}/admin/users/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: params.id,
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        subscription: {
          planId: "1",
          sessionsRemaining: 5,
          totalSessions: 6,
          status: "active",
        },
        medicalInfo: {
          systemicDiseases: ["Diabetes"],
          drugAllergies: ["Penicillin"],
          isPregnant: false,
        },
      },
    });
  }),

  // Appointments management endpoints
  http.get(`${API_BASE_URL}/admin/appointments`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          _id: "1",
          userId: "1",
          user: { name: "John Doe", phone: "9876543210" },
          date: "2024-01-15T10:00:00.000Z",
          timeSlot: "10:00-11:00",
          status: "scheduled",
          sessionNumber: 1,
        },
        {
          _id: "2",
          userId: "2",
          user: { name: "Jane Smith", phone: "9876543211" },
          date: "2024-01-16T14:00:00.000Z",
          timeSlot: "14:00-15:00",
          status: "confirmed",
          sessionNumber: 2,
        },
      ],
    });
  }),

  http.put(`${API_BASE_URL}/admin/appointments/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: "Appointment updated successfully",
      data: {
        _id: params.id,
        status: "rescheduled",
      },
    });
  }),

  // Sessions management endpoints
  http.post(`${API_BASE_URL}/admin/sessions`, () => {
    return HttpResponse.json({
      success: true,
      message: "Session completed successfully",
      data: {
        _id: "1",
        appointmentId: "1",
        userId: "1",
        examination: {
          teethPresent: 32,
          cariesStatus: "No caries detected",
          gumIssues: "Healthy gums",
        },
        completedAt: new Date().toISOString(),
      },
    });
  }),

  // Analytics endpoints
  http.get(`${API_BASE_URL}/admin/analytics/dashboard`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalUsers: 150,
        totalAppointments: 300,
        totalRevenue: 750000,
        completedSessions: 280,
        monthlyStats: {
          newUsers: 25,
          completedAppointments: 45,
          revenue: 112500,
        },
      },
    });
  }),

  http.get(`${API_BASE_URL}/admin/analytics/payments`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalRevenue: 750000,
        monthlyRevenue: [
          { month: "Jan", revenue: 50000 },
          { month: "Feb", revenue: 75000 },
          { month: "Mar", revenue: 60000 },
        ],
        planDistribution: [
          { planName: "6 Sessions", count: 60, revenue: 300000 },
          { planName: "8 Sessions", count: 50, revenue: 350000 },
          { planName: "12 Sessions", count: 40, revenue: 400000 },
        ],
      },
    });
  }),

  // Availability template management endpoints
  http.get(`${API_BASE_URL}/admin/availability/template`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        _id: "availability_template",
        defaultSlots: [
          {
            id: "default-8",
            startTime: "08:00",
            endTime: "09:00",
            isActive: true,
            maxBookings: 1,
          },
          {
            id: "default-9",
            startTime: "09:00",
            endTime: "10:00",
            isActive: true,
            maxBookings: 1,
          },
          {
            id: "default-10",
            startTime: "10:00",
            endTime: "11:00",
            isActive: true,
            maxBookings: 1,
          },
        ],
        workingDays: [1, 2, 3, 4, 5, 6],
        slotDuration: 60,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.put(
    `${API_BASE_URL}/admin/availability/template`,
    async ({ request }) => {
      const templateData = await request.json();
      return HttpResponse.json({
        success: true,
        message: "Template updated successfully",
        data: {
          _id: "availability_template",
          ...templateData,
          updatedAt: new Date().toISOString(),
        },
      });
    }
  ),

  http.post(
    `${API_BASE_URL}/admin/availability/template/slots`,
    async ({ request }) => {
      const slotData = await request.json();
      return HttpResponse.json({
        success: true,
        message: "Custom slot added successfully",
        data: {
          id: `custom-${Date.now()}`,
          ...slotData,
          isActive: true,
          maxBookings: 1,
        },
      });
    }
  ),

  http.delete(
    `${API_BASE_URL}/admin/availability/template/slots/:slotId`,
    ({ params }) => {
      return HttpResponse.json({
        success: true,
        message: "Custom slot removed successfully",
        data: { id: params.slotId },
      });
    }
  ),
];
