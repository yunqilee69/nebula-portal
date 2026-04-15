import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AppContextValue, AuthSession, LocaleCode } from "@nebula/core";

export interface PersonalCenterPageProps {
  appContext: AppContextValue;
  session: AuthSession | null;
  authBusy?: boolean;
  onLogout?: () => Promise<void> | void;
  onRefreshProfile?: () => Promise<void> | void;
}

interface ProfileMetricItem {
  label: string;
  value: string;
}

function buildMetricItems(session: AuthSession | null, unreadCount: number): ProfileMetricItem[] {
  return [
    {
      label: "Roles",
      value: String(session?.user.roles.length ?? 0),
    },
    {
      label: "Permissions",
      value: String(session?.permissions.length ?? 0),
    },
    {
      label: "Unread notifications",
      value: String(unreadCount),
    },
  ];
}

function resolveLocaleLabel(locale: LocaleCode) {
  return locale === "zh-CN" ? "中文" : "English";
}

export function PersonalCenterPage({ appContext, session, authBusy = false, onLogout, onRefreshProfile }: PersonalCenterPageProps) {
  const [localeBusy, setLocaleBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const locale = appContext.i18n.getLocale();
  const unreadCount = appContext.notifications.unreadCount();
  const metrics = useMemo(() => buildMetricItems(session, unreadCount), [session, unreadCount]);
  const profile = session?.user;

  async function handleToggleLocale() {
    if (localeBusy) {
      return;
    }

    setLocaleBusy(true);
    try {
      await appContext.i18n.setLocale(locale === "zh-CN" ? "en-US" : "zh-CN");
    } finally {
      setLocaleBusy(false);
    }
  }

  async function handleRefreshProfile() {
    if (!onRefreshProfile || refreshBusy) {
      return;
    }

    setRefreshBusy(true);
    try {
      await onRefreshProfile();
    } finally {
      setRefreshBusy(false);
    }
  }

  async function handleLogout() {
    if (authBusy) {
      return;
    }

    if (onLogout) {
      await onLogout();
      return;
    }

    await appContext.auth.logout();
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>Nebula Mobile</Text>
      <Text style={styles.title}>Personal Center</Text>
      <Text style={styles.subtitle}>
        Review your current account, permission footprint, notification state, and language preference in one place.
      </Text>

      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile?.username?.slice(0, 1).toUpperCase() ?? "N"}</Text>
        </View>
        <View style={styles.heroContent}>
          <Text style={styles.name}>{profile?.username ?? "Guest user"}</Text>
          <Text style={styles.meta}>User ID: {profile?.userId ?? "Not signed in"}</Text>
          <Text style={styles.meta}>Current locale: {resolveLocaleLabel(locale)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account snapshot</Text>
        <View style={styles.metricGrid}>
          {metrics.map((item) => (
            <View key={item.label} style={styles.metricCard}>
              <Text style={styles.metricValue}>{item.value}</Text>
              <Text style={styles.metricLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Roles</Text>
        <View style={styles.tagList}>
          {(profile?.roles.length ? profile.roles : ["No roles assigned"]).map((role) => (
            <View key={role} style={styles.tag}>
              <Text style={styles.tagText}>{role}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Pressable style={[styles.primaryButton, localeBusy ? styles.buttonDisabled : null]} disabled={localeBusy} onPress={() => void handleToggleLocale()}>
          <Text style={styles.primaryButtonLabel}>{localeBusy ? "Switching language..." : `Switch language (${locale})`}</Text>
        </Pressable>
        {onRefreshProfile ? (
          <Pressable style={[styles.secondaryButton, refreshBusy ? styles.buttonDisabled : null]} disabled={refreshBusy} onPress={() => void handleRefreshProfile()}>
            <Text style={styles.secondaryButtonLabel}>{refreshBusy ? "Refreshing profile..." : "Refresh profile"}</Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.dangerButton, authBusy ? styles.buttonDisabled : null]} disabled={authBusy} onPress={() => void handleLogout()}>
          <Text style={styles.dangerButtonLabel}>{authBusy ? "Signing out..." : "Sign out"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
    backgroundColor: "#f8fafc",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "#355dff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: "#101828",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475467",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#111827",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#355dff",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },
  heroContent: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
    color: "#d0d5dd",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    gap: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#101828",
  },
  metricLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: "#667085",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#e0e7ff",
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#344054",
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#355dff",
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d0d5dd",
  },
  secondaryButtonLabel: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "700",
  },
  dangerButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#111827",
  },
  dangerButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
