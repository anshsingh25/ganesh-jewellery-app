import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

import EntryScreen from '../screens/EntryScreen';
import LoginScreen from '../screens/LoginScreen';
import CustomerLoginScreen from '../screens/CustomerLoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CustomersScreen from '../screens/CustomersScreen';
import AddCustomerScreen from '../screens/AddCustomerScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SchemesScreen from '../screens/SchemesScreen';
import EditCustomerScreen from '../screens/EditCustomerScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';

import CustomerDashboardScreen from '../screens/customer/CustomerDashboardScreen';
import CustomerInstallmentsScreen from '../screens/customer/CustomerInstallmentsScreen';
import CustomerReceiptsScreen from '../screens/customer/CustomerReceiptsScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const headerBg = '#FFFBEB';
const tabBarBg = '#FFFBEB';
const activeTint = '#8B6914';
const inactiveTint = '#78716C';

const screenOptions = {
  headerStyle: { backgroundColor: headerBg },
  headerTintColor: '#1C1917',
  headerShadowVisible: false,
  headerTitleStyle: { fontWeight: '600', fontSize: 18 },
};

const tabBarOptions = {
  tabBarActiveTintColor: activeTint,
  tabBarInactiveTintColor: inactiveTint,
  tabBarStyle: {
    backgroundColor: tabBarBg,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
    paddingTop: 6,
  },
  tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
};

function OwnerTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          tabBarLabel: 'Customers',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="CustomerHome"
        component={CustomerDashboardScreen}
        options={{
          title: 'My EMI',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CustomerInstallments"
        component={CustomerInstallmentsScreen}
        options={{
          title: 'Installments',
          tabBarLabel: 'Installments',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CustomerReceipts"
        component={CustomerReceiptsScreen}
        options={{
          title: 'Receipts',
          tabBarLabel: 'Receipts',
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CustomerProfile"
        component={CustomerProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loggedInCustomer } = useApp();

  if (user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="OwnerMain" component={OwnerTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: 'Add Customer' }} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{ title: 'Customer' }} />
          <Stack.Screen name="EditCustomer" component={EditCustomerScreen} options={{ title: 'Edit Customer' }} />
          <Stack.Screen name="Schemes" component={SchemesScreen} options={{ title: 'Schemes' }} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Payment methods' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (loggedInCustomer) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="CustomerMain" component={CustomerTabs} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Entry" component={EntryScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="OwnerLogin"
          component={LoginScreen}
          options={{ title: 'Owner / Staff Login', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="CustomerLogin"
          component={CustomerLoginScreen}
          options={{ title: 'Customer Login', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
