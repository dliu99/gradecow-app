
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useEffect, useState } from "react";
import { DynamicColorIOS } from 'react-native';
import { Redirect, Stack, usePathname } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getAuthSession, verifyAndRefreshAuth } from "../../../utils/storage";

export default function TabsLayout() {
  


  return (
    <NativeTabs minimizeBehavior='onScrollDown' blurEffect="dark">

      <NativeTabs.Trigger name="dashboard">
        <Label hidden>Dashboard</Label>
        <Icon sf="house" drawable="custom_android_drawable" />//todo: badges with new assignments
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="grades">
        <Label hidden>Grades</Label>
        <Icon sf="chart.bar" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label hidden>Profile</Label>
        <Icon sf="person.crop.circle" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search" role="search">
        <Label hidden>Search</Label>
        <Icon sf="magnifyingglass" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
