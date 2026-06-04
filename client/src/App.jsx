import { StrictMode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/context";
import Guard from "./auth/Guard";

// auth
import Login from "./pages/Login";

// shared layout
import Dashboard from "./layouts/Dashboard";

// admin
import AdminUsers from "./pages/admin/Users";
import AdminFees from "./pages/admin/Fees";
import AdminNotices from "./pages/admin/Notices";
import AdminResults from "./pages/admin/Results";
import AdminTimetables from "./pages/admin/Timetables";

// teacher
import Attendance from "./pages/teacher/Attendance";
import Assignments from "./pages/teacher/Assignments";
import TeacherNotices from "./pages/teacher/Notices";

// student
import StudentFees from "./pages/student/Fees";
import StudentNotices from "./pages/student/Notices";
import StudentAssignments from "./pages/student/Assignments";

export default function App() {
  return (
    <StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* entry */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* admin */}
            <Route
              path="/admin"
              element={
                <Guard roles={["ADMIN"]}>
                  <Dashboard />
                </Guard>
              }
            >
              <Route index element={<Navigate to="users" replace />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="fees" element={<AdminFees />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="timetables" element={<AdminTimetables />} />
              <Route path="notices" element={<AdminNotices />} />
            </Route>

            {/* teacher */}
            <Route
              path="/teacher"
              element={
                <Guard roles={["TEACHER"]}>
                  <Dashboard />
                </Guard>
              }
            >
              <Route index element={<Navigate to="attendance" replace />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="notices" element={<TeacherNotices/>}/>
            </Route>

            {/* student */}
            <Route path="/student" element={<Guard roles={['STUDENT']}><Dashboard/></Guard>}>
              <Route index element={<Navigate to="fees" replace/>}/>
              <Route path="fees" element={<StudentFees/>}/>
              <Route path="notices" element={<StudentNotices />} />
              <Route path="assignments" element={<StudentAssignments />} />
            </Route>

            {/* catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StrictMode>
  );
}
