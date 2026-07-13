import { useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/PrimaryButton';
import { FormField } from '../components/FormField';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionCard } from '../components/SectionCard';
import { RootStackParamList } from '../app/AppNavigator';
import { TaskMap } from '../features/location/TaskMap';
import { geocodeAddress } from '../features/location/geocodingService';
import {
  cancelTaskNotification,
  requestNotificationPermission,
  scheduleTaskNotification,
} from '../features/notifications/notificationService';
import { LOCATION_PRESETS } from '../features/location/presets';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { Task, TaskAttachment, TaskStatus } from '../types/task';
import {
  formatDateOnly,
  formatDateOnlyFromDate,
  formatTimeOnly,
  formatTimeOnlyFromDate,
} from '../utils/date';
import { createId } from '../utils/id';
import { getStatusLabel } from '../utils/task';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  dueDate: z.string().min(1, 'Date is required'),
  dueTime: z.string().min(1, 'Time is required'),
  address: z.string().trim().min(1, 'Location is required'),
  latitude: z
    .string()
    .trim()
    .min(1, 'Latitude is required')
    .refine((value) => {
      const number = Number(value);
      return !Number.isNaN(number) && number >= -90 && number <= 90;
    }, 'Latitude must be between -90 and 90'),
  longitude: z
    .string()
    .trim()
    .min(1, 'Longitude is required')
    .refine((value) => {
      const number = Number(value);
      return !Number.isNaN(number) && number >= -180 && number <= 180;
    }, 'Longitude must be between -180 and 180'),
  status: z.enum(['new', 'in_progress', 'completed', 'cancelled']),
});

type FormValues = z.infer<typeof formSchema>;

type Props = NativeStackScreenProps<RootStackParamList, 'TaskForm'>;

const statusOptions: TaskStatus[] = ['new', 'in_progress', 'completed', 'cancelled'];

const parseFormDateTime = (dueDate: string, dueTime: string, fallback: Date) => {
  const [day, monthText, year] = dueDate.split(' ');
  const [hours, minutes] = dueTime.split(':');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames.findIndex((item) => item === monthText);

  if (!day || month < 0 || !year || !hours || !minutes) {
    return fallback;
  }

  const date = new Date(fallback);
  date.setFullYear(Number(year), month, Number(day));
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

export const TaskFormScreen = ({ navigation, route }: Props) => {
  const colors = useThemeColors();
  const taskId = route.params?.taskId;
  const tasks = useAppStore((state) => state.tasks);
  const createTask = useAppStore((state) => state.createTask);
  const editTask = useAppStore((state) => state.editTask);
  const setTaskNotification = useAppStore((state) => state.setTaskNotification);
  const notificationDemoMode = useAppStore((state) => state.settings.notificationDemoMode);
  const task = useMemo(() => tasks.find((item) => item.id === taskId), [taskId, tasks]);

  const [attachments, setAttachments] = useState<TaskAttachment[]>(task?.attachments ?? []);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [isLocationResolved, setIsLocationResolved] = useState(Boolean(task));
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [resolvedLocationName, setResolvedLocationName] = useState(task?.location.address ?? '');

  const defaultDueDate = useMemo(
    () => (task ? new Date(task.dueDate) : new Date(Date.now() + 2 * 60 * 60 * 1000)),
    [task],
  );

  const defaultValues = useMemo<FormValues>(
    () => ({
      title: task?.title ?? '',
      description: task?.description ?? '',
      dueDate: formatDateOnly(defaultDueDate.toISOString()),
      dueTime: formatTimeOnly(defaultDueDate.toISOString()),
      address: task?.location.address ?? '',
      latitude: String(task?.location.latitude ?? LOCATION_PRESETS[0].latitude),
      longitude: String(task?.location.longitude ?? LOCATION_PRESETS[0].longitude),
      status: task?.status ?? 'new',
    }),
    [defaultDueDate, task],
  );

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    clearErrors,
    setError,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(formSchema),
  });

  const watchedDate = watch('dueDate');
  const watchedTime = watch('dueTime');
  const watchedAddress = watch('address');
  const watchedLatitude = watch('latitude');
  const watchedLongitude = watch('longitude');
  const pickerValue = parseFormDateTime(watchedDate, watchedTime, defaultDueDate);
  const locationPreviewTask: Task | null = isLocationResolved
    ? {
        id: 'location-preview',
        title: watchedAddress.trim() || 'Task location',
        description: '',
        dueDate: defaultDueDate.toISOString(),
        status: 'new',
        location: {
          address: watchedAddress.trim(),
          latitude: Number(watchedLatitude),
          longitude: Number(watchedLongitude),
        },
        attachments: [],
        createdAt: defaultDueDate.toISOString(),
        updatedAt: defaultDueDate.toISOString(),
        syncStatus: 'pending',
      }
    : null;

  const buildDueDate = (values: FormValues) => {
    return parseFormDateTime(values.dueDate, values.dueTime, defaultDueDate).toISOString();
  };

  const handleDateChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    const currentMode = pickerMode;

    if (!currentMode) {
      return;
    }

    if (currentMode === 'date') {
      setValue('dueDate', formatDateOnlyFromDate(selectedDate), { shouldValidate: true });
    } else if (currentMode === 'time') {
      setValue('dueTime', formatTimeOnlyFromDate(selectedDate), { shouldValidate: true });
    }

    if (Platform.OS === 'android') {
      setPickerMode(null);
    }
  };

  const handlePickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow gallery access to attach images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 5,
      });

      if (result.canceled) {
        return;
      }

      const nextAttachments = result.assets.map((asset) => ({
        id: createId('attachment'),
        uri: asset.uri,
        fileName: asset.fileName ?? `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      }));

      setAttachments((prev) => [...prev, ...nextAttachments]);
    } catch (error) {
      Alert.alert('Image picker failed', error instanceof Error ? error.message : 'Unable to select images.');
    }
  };

  const handleLocationSearch = async () => {
    const address = watchedAddress.trim();
    if (!address) {
      setError('address', { message: 'Enter a city or full address first.' });
      return;
    }

    setIsSearchingLocation(true);
    clearErrors('address');
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        setIsLocationResolved(false);
        setError('address', { message: 'Address not found. Check the spelling or add more details.' });
        return;
      }

      setValue('latitude', String(result.latitude), { shouldValidate: true });
      setValue('longitude', String(result.longitude), { shouldValidate: true });
      setResolvedLocationName(result.displayName);
      setIsLocationResolved(true);
    } catch (error) {
      setIsLocationResolved(false);
      setError('address', {
        message: error instanceof Error ? error.message : 'Address search is unavailable. Try a quick location.',
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isLocationResolved) {
      setError('address', { message: 'Search this address on the map or choose a quick location.' });
      return;
    }

    const dueDate = buildDueDate(values);
    if (new Date(dueDate).getTime() <= Date.now()) {
      setError('dueDate', { message: 'Deadline must be in the future' });
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      dueDate,
      status: values.status,
      location: {
        address: values.address.trim(),
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
      },
      attachments,
    };

    const savedTask = task ? editTask(task.id, payload) : createTask(payload);
    if (!savedTask) {
      Alert.alert('Save failed', 'Task could not be saved.');
      return;
    }

    try {
      const permission = await requestNotificationPermission();
      if (!permission.granted) {
        Alert.alert('Notifications disabled', 'Task will be saved, but reminder permission was not granted.');
      } else {
        await cancelTaskNotification(task?.notificationId);
        setTaskNotification(savedTask.id, null);
        const result = await scheduleTaskNotification(savedTask, notificationDemoMode);
        setTaskNotification(savedTask.id, result?.notificationId ?? null);
        if (result?.warning) {
          Alert.alert('Reminder adjusted', result.warning);
        }
      }

    } catch (error) {
      Alert.alert(
        'Task saved without reminder',
        error instanceof Error ? error.message : 'Notification could not be scheduled.',
      );
    }

    navigation.replace('TaskDetails', { taskId: savedTask.id });
  });

  return (
    <ScreenContainer scroll>
      <SectionCard title="Main info">
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Title"
              value={value}
              onChangeText={onChange}
              error={errors.title?.message}
              placeholder="Replace filter on Site A"
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Description"
              value={value}
              onChangeText={onChange}
              error={errors.description?.message}
              multiline
              placeholder="Describe what needs to be done"
            />
          )}
        />
      </SectionCard>

      <SectionCard title="Deadline">
        <View style={styles.inlineButtons}>
          <PrimaryButton label={watchedDate} onPress={() => setPickerMode('date')} variant="secondary" />
          <PrimaryButton label={watchedTime} onPress={() => setPickerMode('time')} variant="secondary" />
        </View>
        {(errors.dueDate?.message || errors.dueTime?.message) ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errors.dueDate?.message ?? errors.dueTime?.message}
          </Text>
        ) : null}
        {pickerMode ? (
          <View style={styles.pickerCard}>
            <DateTimePicker
              mode={pickerMode}
              value={pickerValue}
              is24Hour
              minimumDate={pickerMode === 'date' ? new Date() : undefined}
              onValueChange={handleDateChange}
              onDismiss={() => setPickerMode(null)}
            />
            {Platform.OS === 'ios' ? (
              <PrimaryButton label="Done" onPress={() => setPickerMode(null)} variant="secondary" />
            ) : null}
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="Location">
        <Text style={[styles.locationIntro, { color: colors.textMuted }]}>Search any city or street in Russian or English.</Text>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Address"
              value={value}
              onChangeText={(nextAddress) => {
                onChange(nextAddress);
                setIsLocationResolved(false);
                setResolvedLocationName('');
              }}
              error={errors.address?.message}
              placeholder="City or full address"
            />
          )}
        />
        <PrimaryButton
          label={isSearchingLocation ? 'Searching address...' : 'Search on map'}
          onPress={() => void handleLocationSearch()}
          disabled={isSearchingLocation}
        />
        <View style={styles.quickLocationBlock}>
          <Text style={[styles.quickLocationLabel, { color: colors.textMuted }]}>QUICK LOCATIONS</Text>
          <View style={styles.quickLocationRow}>
            {LOCATION_PRESETS.map((preset) => (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                onPress={() => {
                  setValue('address', preset.address, { shouldValidate: true });
                  setValue('latitude', String(preset.latitude), { shouldValidate: true });
                  setValue('longitude', String(preset.longitude), { shouldValidate: true });
                  setResolvedLocationName(preset.address);
                  setIsLocationResolved(true);
                  clearErrors('address');
                }}
                style={[styles.quickLocationChip, { backgroundColor: colors.surfaceMuted }]}
              >
                <Text style={[styles.quickLocationText, { color: colors.text }]}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {isLocationResolved ? (
          <View style={[styles.locationResult, { backgroundColor: `${colors.success}16` }]}>
            <View style={[styles.locationResultDot, { backgroundColor: colors.success }]} />
            <View style={styles.locationResultText}>
              <Text style={[styles.locationResultTitle, { color: colors.success }]}>Location found</Text>
              <Text style={{ color: colors.textMuted }} numberOfLines={2}>{resolvedLocationName}</Text>
            </View>
          </View>
        ) : null}
        {locationPreviewTask ? (
          <TaskMap
            key={`${watchedLatitude}-${watchedLongitude}`}
            tasks={[locationPreviewTask]}
            interactive={false}
            style={styles.locationPreview}
          />
        ) : null}
      </SectionCard>

      <SectionCard title="Status">
        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <View style={styles.statusRow}>
              {statusOptions.map((status) => (
                <Pressable
                  key={status}
                  onPress={() => onChange(status)}
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: value === status ? colors.primary : colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: value === status ? '#fff' : colors.text }]}>
                    {getStatusLabel(status)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </SectionCard>

      <SectionCard title="Attachments">
        <PrimaryButton label="Pick images" onPress={handlePickImages} variant="secondary" />
        <View style={styles.attachmentsGrid}>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={styles.attachmentItem}>
              <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
              <Text style={[styles.attachmentText, { color: colors.textMuted }]} numberOfLines={1}>
                {attachment.fileName}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <PrimaryButton label={task ? 'Save changes' : 'Create task'} onPress={onSubmit} disabled={isSubmitting} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  inlineButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  errorText: {
    fontSize: 12,
  },
  pickerCard: {
    gap: 8,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
  },
  locationIntro: {
    fontSize: 13,
    lineHeight: 19,
  },
  quickLocationBlock: {
    gap: 9,
  },
  quickLocationLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  quickLocationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickLocationChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  quickLocationText: {
    fontSize: 12,
    fontWeight: '800',
  },
  locationResult: {
    minHeight: 62,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationResultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationResultText: {
    flex: 1,
    gap: 3,
  },
  locationResultTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  locationPreview: {
    width: '100%',
    height: 190,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attachmentItem: {
    width: 92,
    gap: 6,
  },
  attachmentImage: {
    width: 92,
    height: 92,
    borderRadius: 12,
  },
  attachmentText: {
    fontSize: 11,
  },
});
