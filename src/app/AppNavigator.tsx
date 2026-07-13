import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useTheme } from '@react-navigation/native';

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

const HeaderAddButton = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('add_task')}
      onPress={() => navigation.navigate('TaskForm' as never)}
      style={({ pressed }) => [styles.addButton, { backgroundColor: theme.colors.primary, opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={styles.addButtonText}>{t('add_task')}</Text>
    </Pressable>
  );
};

const TasksTabScreen = () => {
  const { t } = useTranslation();

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
        title: t('tab_tasks'),
        headerRight: () => <HeaderAddButton />,
      }}
    />
    <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: t('tab_map'), title: t('tab_map') }} />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ tabBarLabel: t('tab_history'), title: t('tab_history') }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ tabBarLabel: t('tab_settings'), title: t('tab_settings') }}
    />
  </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'left', headerShadowVisible: false, headerTitleStyle: styles.headerTitle }}>
      <Stack.Screen name="Tabs" component={TasksTabScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={({ route }) => ({
          title: route.params?.taskId ? t('edit_task') : t('new_task'),
        })}
      />
      <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ title: t('task_details') }} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  addButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginRight: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
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
