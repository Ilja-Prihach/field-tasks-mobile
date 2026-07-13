import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
import {
  cancelTaskNotification,
  requestNotificationPermission,
  scheduleTaskNotification,
} from '../features/notifications/notificationService';
import { LOCATION_PRESETS } from '../features/location/presets';
import { useAppStore } from '../storage/useAppStore';
import { useThemeColors } from '../theme/useThemeColors';
import { TaskAttachment, TaskStatus } from '../types/task';
import { formatDateOnly, formatTimeOnly } from '../utils/date';
import { createId } from '../utils/id';

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
  const task = useAppStore((state) => state.tasks.find((item) => item.id === taskId));
  const createTask = useAppStore((state) => state.createTask);
  const editTask = useAppStore((state) => state.editTask);
  const setTaskNotification = useAppStore((state) => state.setTaskNotification);
  const notificationDemoMode = useAppStore((state) => state.settings.notificationDemoMode);

  const [attachments, setAttachments] = useState<TaskAttachment[]>(task?.attachments ?? []);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  const defaultDueDate = task ? new Date(task.dueDate) : new Date(Date.now() + 2 * 60 * 60 * 1000);

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
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(formSchema),
  });

  const watchedDate = watch('dueDate');
  const watchedTime = watch('dueTime');
  const pickerValue = parseFormDateTime(watchedDate, watchedTime, defaultDueDate);

  const buildDueDate = (values: FormValues) => {
    return parseFormDateTime(values.dueDate, values.dueTime, defaultDueDate).toISOString();
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setPickerMode(null);
    if (!selectedDate) {
      return;
    }

    if (_event.type === 'dismissed') {
      return;
    }

    if (_event.type === 'set') {
      if (pickerMode === 'date') {
        setValue('dueDate', formatDateOnly(selectedDate.toISOString()), { shouldValidate: true });
      } else if (pickerMode === 'time') {
        setValue('dueTime', formatTimeOnly(selectedDate.toISOString()), { shouldValidate: true });
      }
    }
  };

  const handlePickImages = async () => {
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
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const permission = await requestNotificationPermission();
      if (!permission.granted) {
        Alert.alert('Notifications disabled', 'Task will be saved, but reminder permission was not granted.');
      }

      const dueDate = buildDueDate(values);
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

      if (permission.granted) {
        await cancelTaskNotification(task?.notificationId);
        const result = await scheduleTaskNotification(savedTask, notificationDemoMode);
        setTaskNotification(savedTask.id, result?.notificationId ?? null);
        if (result?.warning) {
          Alert.alert('Reminder adjusted', result.warning);
        }
      }

      navigation.replace('TaskDetails', { taskId: savedTask.id });
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unexpected error');
    }
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
      </SectionCard>

      <SectionCard title="Location">
        <View style={styles.presetRow}>
          {LOCATION_PRESETS.map((preset) => (
            <PrimaryButton
              key={preset.id}
              label={preset.label}
              variant="secondary"
              onPress={() => {
                setValue('address', preset.address, { shouldValidate: true });
                setValue('latitude', String(preset.latitude), { shouldValidate: true });
                setValue('longitude', String(preset.longitude), { shouldValidate: true });
              }}
            />
          ))}
        </View>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Address"
              value={value}
              onChangeText={onChange}
              error={errors.address?.message}
              placeholder="Manual address"
            />
          )}
        />
        <Controller
          control={control}
          name="latitude"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Latitude"
              value={String(value)}
              onChangeText={onChange}
              error={errors.latitude?.message}
              keyboardType="numeric"
            />
          )}
        />
        <Controller
          control={control}
          name="longitude"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Longitude"
              value={String(value)}
              onChangeText={onChange}
              error={errors.longitude?.message}
              keyboardType="numeric"
            />
          )}
        />
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
                  <Text style={{ color: value === status ? '#fff' : colors.text }}>{status}</Text>
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

      {pickerMode ? (
        <DateTimePicker
          mode={pickerMode}
          value={pickerValue}
          is24Hour
          onChange={handleDateChange}
        />
      ) : null}
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
  presetRow: {
    gap: 8,
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
