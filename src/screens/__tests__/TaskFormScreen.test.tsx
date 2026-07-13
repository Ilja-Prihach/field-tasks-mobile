import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../app/AppNavigator';
import { TaskFormScreen } from '../TaskFormScreen';
import { useAppStore } from '../../storage/useAppStore';
import { resetAppStore } from '../../test/storeTestUtils';

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('../../features/location/TaskMap', () => ({
  TaskMap: () => null,
}));
jest.mock('../../features/notifications/notificationService', () => ({
  requestNotificationPermission: jest.fn(async () => ({ granted: true })),
  cancelTaskNotification: jest.fn(async () => undefined),
  scheduleTaskNotification: jest.fn(async () => ({ notificationId: 'notification-1', warning: null })),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

type TaskFormProps = NativeStackScreenProps<RootStackParamList, 'TaskForm'>;

const replaceMock = jest.fn();
const navigation = {
  replace: replaceMock,
} as unknown as TaskFormProps['navigation'];

const route = {
  key: 'TaskForm-test',
  name: 'TaskForm',
  params: undefined,
} as TaskFormProps['route'];

describe('TaskFormScreen', () => {
  beforeEach(async () => {
    resetAppStore();
    await useAppStore.persist.clearStorage();
    replaceMock.mockReset();
  });

  it('shows validation errors when required fields are empty', async () => {
    await render(<TaskFormScreen navigation={navigation} route={route} />);

    await fireEvent.press(screen.getByText('Create task'));

    expect(await screen.findByText('Title is required')).toBeTruthy();
    expect(screen.getByText('Description is required')).toBeTruthy();
    expect(screen.getByText('Location is required')).toBeTruthy();
  });

  it('creates a task through a real user flow with a quick location preset', async () => {
    await render(<TaskFormScreen navigation={navigation} route={route} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Replace filter on Site A'), 'Replace relay');
    await fireEvent.changeText(
      screen.getByPlaceholderText('Describe what needs to be done'),
      'Install a new relay and verify signal levels.',
    );
    await fireEvent.press(screen.getByText('Warsaw'));
    await fireEvent.press(screen.getByText('User 2'));
    await fireEvent.press(screen.getByText('Create task'));

    await waitFor(() => {
      expect(useAppStore.getState().tasks).toHaveLength(1);
    });

    const task = useAppStore.getState().tasks[0];
    expect(task).toMatchObject({
      title: 'Replace relay',
      description: 'Install a new relay and verify signal levels.',
      location: {
        address: 'Marszalkowska 100, Warsaw',
      },
      createdBy: { id: 'user-1', name: 'User 1' },
      assignedTo: { id: 'user-2', name: 'User 2' },
    });
    expect(replaceMock).toHaveBeenCalledWith('TaskDetails', { taskId: task.id });
  });
});
