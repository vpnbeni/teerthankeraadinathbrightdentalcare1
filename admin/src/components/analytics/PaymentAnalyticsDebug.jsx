import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPaymentAnalytics } from "../../store/analyticsSlice";

const PaymentAnalyticsDebug = () => {
  const dispatch = useDispatch();
  const { paymentAnalytics, loading, error } = useSelector(
    (state) => state.analytics || {}
  );

  useEffect(() => {
    // Test with the same date range from your API call
    const params = {
      startDate: "2025-07-31",
      endDate: "2025-08-08",
    };
    dispatch(fetchPaymentAnalytics(params));
  }, [dispatch]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Payment Analytics Debug</h2>

      {loading.payments && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Raw Payment Analytics Data:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(paymentAnalytics, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Overview Data:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(paymentAnalytics?.overview, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Trends Data:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(paymentAnalytics?.trends, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Revenue by Plan:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(paymentAnalytics?.revenueByPlan, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">Payment Method Distribution:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(
              paymentAnalytics?.paymentMethodDistribution,
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalyticsDebug;
