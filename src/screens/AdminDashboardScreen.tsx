import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllLeavesForAdmin, updateLeaveStatus } from "../api/leaveApi";
import { colors } from "../theme/colors";
import { AlertService } from "../components/AlertService";
import { useAuth } from "../context/AuthContext";
import { CollapsibleLeaveItem } from "../components/CollapsibleLeaveItem";
import { downloadAdminReport } from "../api/adminApi";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Download, Clock, ChevronLeft } from "lucide-react-native";
import { format } from "date-fns";

export default function AdminDashboardScreen({ navigation }: any) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const routeParams =
    navigation.getState?.().routes.find((r: any) => r.name === "AdminDashboard")
      ?.params || {};
  const initialFilter = routeParams.filter || "pending";
  const [filter, setFilter] = useState(initialFilter);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["allLeaves", filter],
    queryFn: () => getAllLeavesForAdmin({ status: filter }),
  });

  const leaves = data?.data || [];

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
      message,
    }: {
      id: string;
      status: string;
      message?: string;
    }) =>
      updateLeaveStatus(id, {
        status,
        approverId: currentUser?.id || "",
        approverRole: currentUser?.role || "ADMIN",
        message: message || `Processed by ${currentUser?.displayName}`,
      }),
    onSuccess: (_, variables) => {
      // Manually update cache to remove the item immediately
      queryClient.setQueryData(["allLeaves", filter], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((leave: any) => leave._id !== variables.id),
        };
      });

      queryClient.invalidateQueries({ queryKey: ["allLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      AlertService.toast({
        message: "Status updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      AlertService.error(error, "Update failed.");
    },
  });

  const handleStatusUpdate = (id: string, status: string, message?: string) => {
    AlertService.confirm(
      "Confirm Action",
      `Are you sure you want to ${status} this leave?`,
      () => mutation.mutate({ id, status, message }),
    );
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const data = await downloadAdminReport();

      if (!data) {
        throw new Error("No data received from server");
      }

      const filename = `report_${format(new Date(), "yyyy-MM-dd")}.csv`;
      const fileUri = (FileSystem.documentDirectory || "") + filename;

      await FileSystem.writeAsStringAsync(fileUri, data, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        AlertService.toast({
          message: "Sharing is not available on this device",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Download Error:", error);
      AlertService.error(error, "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <CollapsibleLeaveItem
      item={item}
      onApprove={(id, message) => handleStatusUpdate(id, "approved", message)}
      onReject={(id, message) => handleStatusUpdate(id, "rejected", message)}
      isProcessing={mutation.isPending && mutation.variables?.id === item._id}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <TouchableOpacity
          onPress={handleDownloadReport}
          disabled={isDownloading}
          style={styles.downloadButton}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Download size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {["pending", "approved", "rejected"].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, filter === s && styles.filterBtnActive]}
            onPress={() => setFilter(s)}
          >
            <Text
              style={[
                styles.filterText,
                filter === s && styles.filterTextActive,
              ]}
            >
              {s.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={colors.neutral.base} />
              <Text style={styles.emptyText}>No {filter} requests found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    flex: 1,
    textAlign: "center",
  },
  downloadButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.neutral.light,
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.muted,
  },
  filterTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 12,
    color: colors.text.muted,
    fontSize: 16,
  },
});
