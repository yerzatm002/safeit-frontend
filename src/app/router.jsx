import { createBrowserRouter, Navigate } from "react-router-dom";

import LoginPage from "../auth/LoginPage";

// Layouts
import MainLayout from "../layout/MainLayout";
import AdminLayout from "../layout/AdminLayout";

// Guards
import ProtectedRoute from "../components/ProtectedRoute";
import RoleGuard from "../components/RoleGuard";

// User pages
import Dashboard from "../pages/user/Dashboard";
import InstructionsList from "../pages/user/InstructionsList";
import InstructionDetails from "../pages/user/InstructionDetails";
import TestsList from "../pages/user/TestsList";
import TestPage from "../pages/user/TestPage";
import Results from "../pages/user/Results";
import MyJournal from "../pages/user/MyJournal";

// Admin pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersCRUD from "../pages/admin/UsersCRUD";
import InstructionsCRUD from "../pages/admin/InstructionsCRUD";
import AttachmentsManager from "../pages/admin/AttachmentsManager";
import TestsCRUD from "../pages/admin/TestsCRUD";
import Journals from "../pages/admin/Journals";
import Reports from "../pages/admin/ReportsPage";
import AcksJournal from "../pages/admin/AcksJournal";
import TestsJournal from "../pages/admin/TestsJournal";

export const router = createBrowserRouter([
  // ✅ Root redirect
  { path: "/", element: <Navigate to="/dashboard" replace /> },

  // ✅ Public routes
  { path: "/login", element: <LoginPage /> },

  // ✅ USER routes (role = user)
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={["user"]}>
          <MainLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "instructions", element: <InstructionsList /> },
      { path: "instructions/:id", element: <InstructionDetails /> },
      { path: "tests", element: <TestsList /> },
      { path: "tests/:id", element: <TestPage /> },
      { path: "results", element: <Results /> },
      { path: "journal", element: <MyJournal /> },
    ],
  },

  // ✅ ADMIN routes (role = admin)
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={["admin"]}>
          <AdminLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "users", element: <UsersCRUD /> },
      { path: "instructions", element: <InstructionsCRUD /> },
      { path: "attachments", element: <AttachmentsManager /> },
      { path: "tests", element: <TestsCRUD /> },
      { path: "journals", element: <Journals /> },
      { path: "reports", element: <Reports /> },
      { path: "journals/acks", element: <AcksJournal /> },
      { path: "journals/tests", element: <TestsJournal /> },

    ],
  },

  // ✅ Not found fallback
  { path: "*", element: <Navigate to="/login" replace /> },
]);
