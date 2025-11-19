import InvoiceDonutChart from "../components/dashboardComponent/paichart";
import InvoiceLineChart from "../components/dashboardComponent/InvoiceLineChart";
import InvoiceStats from "../components/dashboardComponent/InvoiceStats";
import RevenueStatusChart from "../components/dashboardComponent/RevenueStatusChart";

export default function Dashboard() {
  return (
    <div >
      <h1>Welcome to the Dashboard Page</h1>
      <p>This is the dashboard of the application.</p>
    { <InvoiceStats />}
    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
      <div style={{width: '50%'}}>
        {<RevenueStatusChart />}

      </div>
 <div style={{width: '50%'}}>
        {< InvoiceDonutChart/>}

      </div>
     
    </div>
     <div style={{ marginTop: '20px' }}>
      {<InvoiceLineChart />}
     </div>
      
    </div>
  );
}