import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { format, parseISO } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Check,
  X,
  Info,
} from "lucide-react-native";
import { colors } from "../theme/colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TimelineItem {
  _id: string;
  dateIso: string;
  dayType: string;
  isPaid: boolean;
  status: string;
  reasonCode: string;
  deductionValue: number;
}

interface Employee {
  _id: string;
  displayName: string;
  email: string;
  department: string;
}

interface LeaveApplication {
  _id: string;
  applicationId: string;
  status: string;
  requestType: string;
  employee: Employee;
  leaveDetails: {
    category: string;
    totalDaysRequested: number;
    paidDaysCount: number;
    unpaidDaysCount: number;
  };
  timeline: TimelineItem[];
  createdAt: string;
}

interface Props {
  item: LeaveApplication;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const CollapsibleLeaveItem: React.FC<Props> = ({
  item,
  onApprove,
  onReject,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return colors.status.approved;
      case "rejected":
        return colors.status.rejected;
      default:
        return colors.status.pending;
    }
  };

  // Safe date range calculation
  const getDatesSummary = () => {
    if (!item.timeline || item.timeline.length === 0)
      return "No dates specified";
    if (item.timeline.length === 1) {
      return format(parseISO(item.timeline[0].dateIso), "MMM dd, yyyy");
    }
    const sorted = [...item.timeline].sort(
      (a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime(),
    );
    const start = format(parseISO(sorted[0].dateIso), "MMM dd");
    const end = format(
      parseISO(sorted[sorted.length - 1].dateIso),
      "MMM dd, yyyy",
    );
    return `${start} - ${end}`;
  };

  const formatCategory = (cat: string) => {
    return cat || "";
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpand}
        style={styles.cardHeader}
      >
        <View style={styles.userInfo}>
          <View style={styles.userIcon}>
            <UserIcon size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>
              {item.employee?.displayName || "Anonymous"}
            </Text>
            <Text style={styles.dateSummary}>{getDatesSummary()}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "15" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.neutral.base} />
          ) : (
            <ChevronDown size={20} color={colors.neutral.base} />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.mainInfo}>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>Type: </Text>
          <Text style={styles.infoValue}>
            {formatCategory(item.leaveDetails.category) ||
              item.requestType.toUpperCase()}
          </Text>
        </View>
        <View style={styles.infoPill}>
          <Text style={styles.infoLabel}>Total: </Text>
          <Text style={styles.infoValue}>
            {item.leaveDetails.totalDaysRequested}d
          </Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Timeline Details</Text>
          {item.timeline?.map((day, index) => (
            <View key={day._id || index} style={styles.timelineItem}>
              <View style={styles.timelineDate}>
                <Text style={styles.timelineDateText}>{day.reasonCode}</Text>
                <Text style={styles.timelineDateText}>
                  {format(parseISO(day.dateIso), "EEE, MMM dd")}
                </Text>
              </View>
              <View style={styles.timelineConfig}>
                <Text style={styles.timelineTypeText}>
                  {day.dayType.replace("_", " ").toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.timelinePaidText,
                    {
                      color: day.isPaid
                        ? colors.status.approved
                        : colors.status.rejected,
                    },
                  ]}
                >
                  {day.isPaid ? "Paid" : "Unpaid"}
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Paid Leave</Text>
              <Text style={styles.summaryValue}>
                {item.leaveDetails.paidDaysCount}
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Unpaid Leave</Text>
              <Text style={styles.summaryValue}>
                {item.leaveDetails.unpaidDaysCount}
              </Text>
            </View>
          </View>

          {item.status === "pending" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => onReject(item._id)}
              >
                <X size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => onApprove(item._id)}
              >
                <Check size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footerInfo}>
            <Info size={12} color={colors.neutral.base} />
            <Text style={styles.appIdText}>ID: {item.applicationId}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.light,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  dateSummary: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  mainInfo: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text.muted,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.muted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timelineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  timelineDate: {
    flex: 1,
  },
  timelineDateText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  timelineConfig: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  timelineTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text.muted,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timelinePaidText: {
    fontSize: 11,
    fontWeight: "700",
    width: 45,
    textAlign: "right",
  },
  summaryContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  approveButton: {
    backgroundColor: colors.status.approved,
  },
  rejectButton: {
    backgroundColor: colors.status.rejected,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 4,
    justifyContent: "center",
  },
  appIdText: {
    fontSize: 10,
    color: colors.neutral.base,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
