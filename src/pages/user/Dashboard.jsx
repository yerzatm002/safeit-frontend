import { Button } from "@mui/material";
import http from "../../api/http";

export default function Dashboard() {
  const test = async () => {
    try {
      const res = await http.get("/api/instructions");
      console.log("OK:", res.data);
    } catch (e) {
      console.log("ERR:", e);
    }
  };

  return (
    <div>
      <h1>User Dashboard</h1>
      <Button onClick={test}>Test API</Button>
    </div>
  );
}
