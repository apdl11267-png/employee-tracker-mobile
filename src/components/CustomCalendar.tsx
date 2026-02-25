import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  addMonths,
  format,
  startOfMonth,
  subMonths,
  eachDayOfInterval,
  endOfMonth,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { colors } from "../theme/colors";

interface CustomCalendarProps {
  selectedDates: string[]; // ISO strings
  onDateSelect: (dateIso: string) => void;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selectedDates,
  onDateSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
          <ChevronLeft color={colors.primary} size={24} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <ChevronRight color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.daysGrid}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <Text key={day} style={styles.dayLabel}>
            {day}
          </Text>
        ))}

        {/* Fill empty boxes for days before start of month */}
        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map(
          (_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ),
        )}

        {daysInMonth.map((date, index) => {
          const dateIso = format(date, "yyyy-MM-dd");
          const isSelected = selectedDates.includes(dateIso);
          const isToday = isSameDay(date, new Date());

          return (
            <TouchableOpacity
              key={dateIso}
              style={[
                styles.dayCell,
                isSelected && styles.selectedCell,
                isToday && !isSelected && styles.todayCell,
              ]}
              onPress={() => onDateSelect(dateIso)}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.selectedText,
                  isToday && styles.todayText,
                ]}
              >
                {format(date, "d")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.main,
  },
  navButton: {
    padding: 8,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayLabel: {
    width: "14.28%",
    textAlign: "center",
    color: colors.text.muted,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedCell: {
    backgroundColor: colors.secondary,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  dayText: {
    fontSize: 14,
    color: colors.text.main,
  },
  selectedText: {
    color: colors.text.inverse,
    fontWeight: "bold",
  },
  todayText: {
    color: colors.secondary,
    fontWeight: "bold",
  },
});
