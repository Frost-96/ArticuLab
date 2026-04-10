"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/appStore";
import {
  Bell,
  CreditCard,
  Crown,
  Globe,
  LogOut,
  Moon,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";

export default function Page() {
  const { user } = useAppStore();

  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyReport: true,
    reviewReady: true,
    streakAlert: false,
  });

  const [appearance, setAppearance] = useState({
    darkMode: false,
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Password</p>
              <p className="text-xs text-slate-500">
                Last changed 3 months ago
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-500" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {user.plan === "pro" ? "Pro Plan" : "Free Plan"}
                </p>
                <p className="text-xs text-slate-500">
                  {user.plan === "pro"
                    ? "Unlimited sessions, AI feedback, priority support"
                    : "5 sessions/month, basic feedback"}
                </p>
              </div>
            </div>
            {user.plan === "pro" ? (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                Active
              </Badge>
            ) : (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Upgrade
              </Button>
            )}
          </div>
          {user.plan === "pro" && (
            <div className="pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" className="text-slate-600">
                Manage Billing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            {
              key: "dailyReminder" as const,
              label: "Daily Practice Reminder",
              desc: "Get reminded to practice every day",
            },
            {
              key: "weeklyReport" as const,
              label: "Weekly Progress Report",
              desc: "Summary of your weekly learning",
            },
            {
              key: "reviewReady" as const,
              label: "Review Ready",
              desc: "When your essay feedback is available",
            },
            {
              key: "streakAlert" as const,
              label: "Streak at Risk",
              desc: "Alert when your streak might break",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4 text-slate-500" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-slate-900">Dark Mode</p>
              <p className="text-xs text-slate-500">
                Switch to a darker color scheme
              </p>
            </div>
            <Switch
              checked={appearance.darkMode}
              onCheckedChange={(checked) =>
                setAppearance((prev) => ({ ...prev, darkMode: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" />
            Language & Region
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Interface Language
              </p>
              <p className="text-xs text-slate-500">English (US)</p>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Target Language
              </p>
              <p className="text-xs text-slate-500">English</p>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <Shield className="h-4 w-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-slate-900">Sign Out</p>
              <p className="text-xs text-slate-500">
                Sign out of your account on this device
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Delete Account
              </p>
              <p className="text-xs text-slate-500">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
