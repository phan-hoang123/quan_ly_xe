import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
        headerShown: false, // Tàng hình Header
        tabBarStyle: { display: 'none' } // Tàng hình luôn thanh Tab dưới đáy
    }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
    </Tabs>
  );
}