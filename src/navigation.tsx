import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "./context/AuthContext";
import { useTenant } from "./context/TenantContext";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import LeaveHistoryScreen from "./screens/LeaveHistoryScreen";
import LeaveApplicationScreen from "./screens/LeaveApplicationScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import CreateEmployeeScreen from "./screens/CreateEmployeeScreen";
import EmployeeListScreen from "./screens/EmployeeListScreen";
import EditEmployeeScreen from "./screens/EditEmployeeScreen";
import EmployeeDetailsScreen from "./screens/EmployeeDetailsScreen";
import FindOrganizationScreen from "./screens/FindOrganizationScreen";
import RegisterOrganizationScreen from "./screens/RegisterOrganizationScreen";
import RegisterAdminScreen from "./screens/RegisterAdminScreen";
import LeaveDetailsScreen from "./screens/LeaveDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { currentTenant, isLoadingTenant } = useTenant();

  const isAdmin = user?.role === "ADMIN" || user?.role === "HR_ADMIN";

  if (authLoading || isLoadingTenant) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" },
      }}
    >
      {!currentTenant ? (
        // Phase 1: Organization Discovery
        <>
          <Stack.Screen
            name="FindOrganization"
            component={FindOrganizationScreen}
          />
          <Stack.Screen
            name="RegisterOrganization"
            component={RegisterOrganizationScreen}
          />
        </>
      ) : !user ? (
        // Phase 2: User Login (Scoped to Tenant)
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RegisterAdmin" component={RegisterAdminScreen} />
        </>
      ) : (
        // Phase 3: Authenticated App
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="LeaveHistory" component={LeaveHistoryScreen} />
          <Stack.Screen name="ApplyLeave" component={LeaveApplicationScreen} />
          <Stack.Screen name="LeaveDetails" component={LeaveDetailsScreen} />

          {isAdmin && (
            <>
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
              />
              <Stack.Screen
                name="CreateEmployee"
                component={CreateEmployeeScreen}
              />
              <Stack.Screen
                name="EmployeeList"
                component={EmployeeListScreen}
              />
              <Stack.Screen
                name="EditEmployee"
                component={EditEmployeeScreen}
              />
              <Stack.Screen
                name="EmployeeDetails"
                component={EmployeeDetailsScreen}
              />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
}
