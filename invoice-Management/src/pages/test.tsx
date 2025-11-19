import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const Test = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        // either relative path (if frontend proxies /api to your backend) or full URL:
        // const url = "/api/v1/user-invoices/project";
        const url = "/api/v1/user-invoices/project";

        const token = Cookies.get("token"); // make sure token exists
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(url, { headers });
        setData(res.data);
      } catch (err) {
        // keep useful error info
        setError(err.response?.data ?? err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectInvoices();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Project API Test</h1>

      {loading && <p>Loading…</p>}

      {error && (
        <>
          <h3 style={{ color: "crimson" }}>Error</h3>
          <pre>{typeof error === "string" ? error : JSON.stringify(error, null, 2)}</pre>
        </>
      )}

      {!loading && !error && (
        <>
          <h3>Response</h3>
          {/* show string directly, otherwise pretty-print JSON */}
          {typeof data === "string" ? <pre>{data}</pre> : <pre>{JSON.stringify(data, null, 2)}</pre>}
        </>
      )}
    </div>
  );
};

export default Test;
