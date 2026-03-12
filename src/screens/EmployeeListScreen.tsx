import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { employeeApi, EmployeeData } from "../api/employeeApi";
import { colors } from "../theme/colors";
import {
  ChevronLeft,
  Search,
  User,
  Edit2,
  ChevronRight,
  Mail,
  Briefcase,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmployeeListScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState("");

  const routeParams =
    navigation.getState?.().routes.find((r: any) => r.name === "EmployeeList")
      ?.params || {};
  const employeesIds = (routeParams?.employees as EmployeeData[])
    ?.map((x: EmployeeData) => x?._id)
    ?.join(",");
  const filterTitle: string | undefined = routeParams?.filterTitle;
  const readOnly: boolean = routeParams?.readOnly ?? false;

  const {
    data: allEmployees,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["employees", employeesIds],
    queryFn: () => employeeApi.getAllEmployees(employeesIds, readOnly),
  });

  const employees: EmployeeData[] = allEmployees || [];

  const filtered = employees.filter(
    (emp) =>
      emp.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.department ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Initials from displayName
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Deterministic bg colour per employee
  const AVATAR_COLORS = [
    "#258CF4",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#0EA5E9",
  ];
  const avatarColor = (id: string) =>
    AVATAR_COLORS[
      id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
        AVATAR_COLORS.length
    ];

  const renderItem = ({
    item,
    index,
  }: {
    item: EmployeeData;
    index: number;
  }) => {
    const bg = avatarColor(item._id);
    const initials = getInitials(item.displayName);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.card}
        onPress={() =>
          navigation.navigate("EmployeeDetails", { employee: item })
        }
      >
        <View style={styles.cardTop}>
          {/* Avatar & Basic Info */}
          <View style={styles.mainInfo}>
            <View style={[styles.avatar, { backgroundColor: `${bg}15` }]}>
              <Text style={[styles.avatarText, { color: bg }]}>{initials}</Text>
            </View>
            <View style={styles.nameSection}>
              <Text style={styles.name} numberOfLines={1}>
                {item.displayName}
              </Text>
              <View style={styles.row}>
                <Mail size={12} color={colors.text.muted} style={styles.icon} />
                <Text style={styles.subText} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
              <View style={styles.row}>
                <Briefcase
                  size={12}
                  color={colors.text.muted}
                  style={styles.icon}
                />
                <Text style={styles.subText} numberOfLines={1}>
                  {item.department || "No Department"}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button (Edit) */}
          {!readOnly && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate("EditEmployee", { employee: item })
              }
            >
              <Edit2 size={16} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[styles.statValue, { color: colors.status.approved }]}>
              {item.remainingLeave}d
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Leave</Text>
            <Text style={styles.statValue}>{item.totalLeave}d</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>WFH Taken</Text>
            <Text style={styles.statValue}>{item.totalWfhTaken}d</Text>
          </View>
          <View style={styles.chevronWrap}>
            <ChevronRight size={18} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{filterTitle || "Employees"}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={18} color={colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or department…"
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Count */}
      {!isLoading && (
        <Text style={styles.countLabel}>
          {filtered.length} {filtered.length === 1 ? "person" : "people"}
        </Text>
      )}

      {/* List */}
      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.secondary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.secondary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <User size={40} color={colors.neutral.base} />
              <Text style={styles.emptyText}>No employees found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.main,
  },
  countLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  mainInfo: {
    flexDirection: "row",
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
  },
  nameSection: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text.main,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  icon: {
    marginTop: 1,
  },
  subText: {
    fontSize: 13,
    color: colors.text.muted,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.secondary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    color: colors.text.muted,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#E2E8F0",
  },
  chevronWrap: {
    marginLeft: 4,
  },
  empty: {
    alignItems: "center",
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 15,
  },
});
