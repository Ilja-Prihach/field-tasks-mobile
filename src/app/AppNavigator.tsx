import { Pressable, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useTheme } from '@react-navigation/native';

import { HistoryScreen } from '../screens/HistoryScreen';
import { MapScreen } from '../screens/MapScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TaskDetailsScreen } from '../screens/TaskDetailsScreen';
import { TaskFormScreen } from '../screens/TaskFormScreen';
import { TaskListScreen } from '../screens/TaskListScreen';

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

  return (
    <Pressable onPress={() => navigation.navigate('TaskForm' as never)} style={{ paddingHorizontal: 12 }}>
      <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Add</Text>
    </Pressable>
  );
};

const TasksTabScreen = () => (
  <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
    <Tab.Screen
      name="Tasks"
      component={TaskListScreen}
      options={{
        tabBarLabel: 'Tasks',
        headerRight: () => <HeaderAddButton />,
      }}
    />
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="History" component={HistoryScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
    <Stack.Screen name="Tabs" component={TasksTabScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="TaskForm"
      component={TaskFormScreen}
      options={({ route }) => ({
        title: route.params?.taskId ? 'Edit Task' : 'New Task',
      })}
    />
    <Stack.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ title: 'Task Details' }} />
  </Stack.Navigator>
);
