// ============================================================================
// Web Header - Premium Navigation for Desktop/Tablet with Dark Mode
// ============================================================================

import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Image,
  Platform,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  HomeIcon,
  ResourcesIcon,
  ProfileIcon,
  SavesIcon,
} from "@/components/icons";

// Use native driver only on native platforms, not on web
const USE_NATIVE_DRIVER = Platform.OS !== "web";

const Logo = require("../../../assets/icon.png");

interface NavItem {
  label: string;
  path: string;
  iconComponent: (color: string) => React.ReactNode;
}

export function WebHeader() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  // Only show on web and tablet+
  if (Platform.OS !== "web" || width < 768) {
    return null;
  }

  const navItems: NavItem[] = [
    {
      label: "Accueil",
      path: "/(tabs)",
      iconComponent: (color) => <HomeIcon size={20} color={color} />,
    },
    {
      label: "Ressources",
      path: "/(tabs)/resources",
      iconComponent: (color) => <ResourcesIcon size={20} color={color} />,
    },
    {
      label: "Sauvegardées",
      path: "/saved",
      iconComponent: (color) => <SavesIcon size={20} color={color} />,
    },
    {
      label: "Profil",
      path: "/(tabs)/profile",
      iconComponent: (color) => <ProfileIcon size={20} color={color} />,
    },
  ];

  const isActive = (path: string) => {
    // Handle home/Accueil tab explicitly
    if (path === "/(tabs)") {
      return (
        pathname === "/" || pathname === "/(tabs)" || pathname === "/index"
      );
    }
    // For other tabs, check if pathname matches the path segment
    const pathSegment = path.replace("/(tabs)", "");
    return pathSegment !== "" && pathname.includes(pathSegment);
  };

  return (
    <View
      style={{
        backgroundColor: isDark
          ? "rgba(31, 31, 31, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 24,
        paddingVertical: 12,
        // @ts-ignore - web-specific styles
        backdropFilter: "blur(20px)",

        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <View
        style={{
          maxWidth: 1200,
          width: "100%",
          marginHorizontal: "auto",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo & Brand */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: colors.primaryMuted,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Image
              source={Logo}
              style={{
                width: 32,
                height: 32,
                resizeMode: "contain",
                borderRadius: 10,
              }}
            />
          </View>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: colors.text,
                letterSpacing: -0.5,
              }}
            >
              FMC Study
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                fontWeight: "500",
              }}
            >
              Study Everywhere
            </Text>
          </View>
        </TouchableOpacity>

        {/* Navigation */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
              onPress={() => router.push(item.path as any)}
              colors={colors}
            />
          ))}
        </View>

        {/* User Info */}
        {user && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ marginRight: 12, alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                }}
              >
                {user.full_name}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                {user.year_of_study}
                {user.year_of_study === "1" ? "ère" : "ème"} Année
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}
              >
                {user.full_name?.charAt(0)?.toUpperCase() || "👤"}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// Animated Nav Link
function NavLink({
  item,
  isActive,
  onPress,
  colors,
}: {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgOpacity, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      tension: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  const iconColor = isActive ? colors.primary : colors.textSecondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 12,
          backgroundColor: isActive ? colors.primaryMuted : "transparent",
        }}
      >
        <View
          style={{
            marginRight: 8,
            opacity: isActive ? 1 : 0.6,
          }}
        >
          {item.iconComponent(iconColor)}
        </View>
        <Text
          style={{
            fontSize: 14,
            fontWeight: isActive ? "600" : "500",
            color: isActive ? colors.primary : colors.textSecondary,
          }}
        >
          {item.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default WebHeader;
