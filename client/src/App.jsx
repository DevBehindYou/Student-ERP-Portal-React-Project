import { StrictMode, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/context";
import Guard from "./auth/Guard";
import ServerHealthGuard from "./components/ServerHealthGuard";

// Lazy-loaded components for optimal bundle splitting
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./layouts/Dashboard"));

// Admin pages
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminFees = lazy(() => import("./pages/admin/Fees"));
const AdminNotices = lazy(() => import("./pages/admin/Notices"));
const AdminResults = lazy(() => import("./pages/admin/Results"));
const AdminTimetables = lazy(() => import("./pages/admin/Timetables"));

// Teacher pages
const Attendance = lazy(() => import("./pages/teacher/Attendance"));
const Assignments = lazy(() => import("./pages/teacher/Assignments"));
const TeacherNotices = lazy(() => import("./pages/teacher/Notices"));

// Student pages
const StudentFees = lazy(() => import("./pages/student/Fees"));
const StudentNotices = lazy(() => import("./pages/student/Notices"));
const StudentAssignments = lazy(() => import("./pages/student/Assignments"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#080d16] transition-colors duration-300">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500/20 border-t-sky-500" />
    </div>
  );
}

export default function App() {
  return (
    <StrictMode>
      <AuthProvider>
        <ServerHealthGuard>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </BrowserRouter>
        </ServerHealthGuard>
      </AuthProvider>
    </StrictMode>
  );
}
