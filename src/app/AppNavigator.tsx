import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';

import { HistoryScreen } from '../screens/HistoryScreen';
import { MapScreen } from '../screens/MapScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TaskDetailsScreen } from '../screens/TaskDetailsScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { TaskListScreen } from '../screens/TaskListScreen';
import { useTranslation } from '../utils/useTranslation';

export type RootStackParamList = {
  Tabs: undefined;
  TaskForm: { taskId?: string } | undefined;
  TaskDetails: { taskId: string };
};

export type TabParamList = {
  Tasks: undefined;
  Map: undefined;
  History: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TasksTabScreen = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      headerTitleAlign: 'left',
      headerShadowVisible: false,
      headerTitleStyle: styles.headerTitle,
      tabBarActiveTintColor: '#E45D3B',
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      tabBarIcon: ({ color, focused }) => (
        <View style={[styles.tabIcon, { backgroundColor: focused ? `${color}20` : 'transparent' }]}>
          <Text style={[styles.tabIconText, { color }]}>{route.name.slice(0, 1)}</Text>
        </View>
      ),
    })}
  >
    <Tab.Screen
      name="Tasks"
      component={TaskListScreen}
      options={{
        tabBarLabel: t('tab_tasks'),
        headerShown: false,
      }}
    />
    <Tab.Screen
      name="Map"
      component={MapScreen}
      options={{ tabBarLabel: t('tab_map'), title: t('tab_map'), headerStyle: { backgroundColor: theme.colors.background } }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ tabBarLabel: t('tab_history'), headerShown: false }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarLabel: t('tab_settings'), headerShown: false }}
    />
  </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'left', headerShadowVisible: false, headerTitleStyle: styles.headerTitle, headerStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="Tabs" component={TasksTabScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  tabBar: {
    height: 76,
    paddingTop: 7,
    paddingBottom: 9,
    borderTopWidth: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabIcon: {
    width: 30,
    height: 26,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
