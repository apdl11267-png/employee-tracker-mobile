import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "./context/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import LeaveHistoryScreen from "./screens/LeaveHistoryScreen";
import LeaveApplicationScreen from "./screens/LeaveApplicationScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import CreateEmployeeScreen from "./screens/CreateEmployeeScreen";
import EmployeeListScreen from "./screens/EmployeeListScreen";
import EditEmployeeScreen from "./screens/EditEmployeeScreen";
import EmployeeDetailsScreen from "./screens/EmployeeDetailsScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "HR_ADMIN";

  if (loading) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="LeaveHistory" component={LeaveHistoryScreen} />
          <Stack.Screen name="ApplyLeave" component={LeaveApplicationScreen} />

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
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
