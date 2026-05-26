import { HapticTab } from "@/components/HapticTab";
import AddButton from "@/components/interactions/buttons/addbutton";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import AntDesign from "@react-native-vector-icons/ant-design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Octicons } from "@react-native-vector-icons/octicons";
import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Lucide size={28} name="layout-dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: "Diary",
          tabBarIcon: ({ color }) => <Lucide size={28} name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => <AntDesign color={color} size={size} name="plus" />,
          tabBarButton: () => <AddButton />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => <Octicons name="goal" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <Ionicons name="ellipsis-horizontal" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
