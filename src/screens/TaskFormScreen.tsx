import { useMemo, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
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
import { UserSelector } from '../features/users/UserSelector';
import { getUserById } from '../features/users/users';
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
import { useTranslation } from '../utils/useTranslation';
import {
  formatDateOnly,
  formatDateOnlyFromDate,
  formatTimeOnly,
  formatTimeOnlyFromDate,
} from '../utils/date';
import { createId } from '../utils/id';
import { getStatusLabel } from '../utils/task';

type FormValues = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  address: string;
  latitude: string;
  longitude: string;
  status: TaskStatus;
  assignedToId: string;
};

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
  const { language, t } = useTranslation();
  const taskId = route.params?.taskId;
  const tasks = useAppStore((state) => state.tasks);
  const createTask = useAppStore((state) => state.createTask);
  const editTask = useAppStore((state) => state.editTask);
  const setTaskNotification = useAppStore((state) => state.setTaskNotification);
  const notificationDemoMode = useAppStore((state) => state.settings.notificationDemoMode);
  const currentUserId = useAppStore((state) => state.settings.currentUserId);
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
      assignedToId: task?.assignedTo.id ?? currentUserId,
    }),
    [currentUserId, defaultDueDate, task],
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
    resolver: zodResolver(
      z.object({
        title: z.string().trim().min(1, t('title_required')),
        description: z.string().trim().min(1, t('description_required')),
        dueDate: z.string().min(1, t('date_required')),
        dueTime: z.string().min(1, t('time_required')),
        address: z.string().trim().min(1, t('location_required')),
        latitude: z
          .string()
          .trim()
          .min(1, t('latitude_required'))
          .refine((value) => {
            const number = Number(value);
            return !Number.isNaN(number) && number >= -90 && number <= 90;
          }, t('latitude_range')),
        longitude: z
          .string()
          .trim()
          .min(1, t('longitude_required'))
          .refine((value) => {
            const number = Number(value);
            return !Number.isNaN(number) && number >= -180 && number <= 180;
          }, t('longitude_range')),
        status: z.enum(['new', 'in_progress', 'completed', 'cancelled']),
        assignedToId: z.string().min(1),
      }),
    ),
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
        title: watchedAddress.trim() || t('location'),
        description: '',
        dueDate: defaultDueDate.toISOString(),
        status: 'new',
        location: {
          address: watchedAddress.trim(),
          latitude: Number(watchedLatitude),
          longitude: Number(watchedLongitude),
        },
        attachments: [],
        createdBy: getUserById(currentUserId),
        assignedTo: getUserById(currentUserId),
        createdAt: defaultDueDate.toISOString(),
        updatedAt: defaultDueDate.toISOString(),
        syncStatus: 'pending',
      }
    : null;

  const buildDueDate = (values: FormValues) => {
    return parseFormDateTime(values.dueDate, values.dueTime, defaultDueDate).toISOString();
  };

  const applyPickerValue = (mode: 'date' | 'time', selectedDate: Date) => {
    if (mode === 'date') {
      setValue('dueDate', formatDateOnlyFromDate(selectedDate), { shouldValidate: true });
    } else {
      setValue('dueTime', formatTimeOnlyFromDate(selectedDate), { shouldValidate: true });
    }
  };

  const handleDateChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (pickerMode) {
      applyPickerValue(pickerMode, selectedDate);
    }
  };

  const openPicker = (mode: 'date' | 'time') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode,
        value: pickerValue,
        is24Hour: true,
        minimumDate: mode === 'date' ? new Date() : undefined,
        onValueChange: (_event, selectedDate) => applyPickerValue(mode, selectedDate),
      });
      return;
    }

    setPickerMode(mode);
  };

  const handlePickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('permission_required'), t('allow_gallery_access'));
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
      Alert.alert(t('image_picker_failed'), error instanceof Error ? error.message : t('unable_to_select_images'));
    }
  };

  const handleLocationSearch = async () => {
    const address = watchedAddress.trim();
    if (!address) {
      setError('address', { message: t('enter_city_or_address_first') });
      return;
    }

    setIsSearchingLocation(true);
    clearErrors('address');
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        setIsLocationResolved(false);
        setError('address', { message: t('address_not_found') });
        return;
      }

      setValue('latitude', String(result.latitude), { shouldValidate: true });
      setValue('longitude', String(result.longitude), { shouldValidate: true });
      setResolvedLocationName(result.displayName);
      setIsLocationResolved(true);
    } catch (error) {
      setIsLocationResolved(false);
      setError('address', {
        message: error instanceof Error ? error.message : t('address_search_unavailable'),
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isLocationResolved) {
      setError('address', { message: t('search_address_or_quick_location') });
      return;
    }

    const dueDate = buildDueDate(values);
    if (new Date(dueDate).getTime() <= Date.now()) {
      setError('dueDate', { message: t('deadline_must_be_future') });
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
      assignedTo: getUserById(values.assignedToId),
    };

    const savedTask = task ? editTask(task.id, payload) : createTask(payload);
    if (!savedTask) {
      Alert.alert(t('save_failed'), t('task_could_not_be_saved'));
      return;
    }

    try {
      const permission = await requestNotificationPermission();
      if (!permission.granted) {
        Alert.alert(t('notifications_disabled'), t('reminder_permission_not_granted'));
      } else {
        await cancelTaskNotification(task?.notificationId);
        setTaskNotification(savedTask.id, null);
        const result = await scheduleTaskNotification(savedTask, notificationDemoMode);
        setTaskNotification(savedTask.id, result?.notificationId ?? null);
        if (result?.warning) {
          Alert.alert(t('reminder_adjusted'), result.warning);
        }
      }

    } catch (error) {
      Alert.alert(
        t('task_saved_without_reminder'),
        error instanceof Error ? error.message : t('notification_could_not_be_scheduled'),
      );
    }

    navigation.replace('TaskDetails', { taskId: savedTask.id });
  });

  return (
    <ScreenContainer scroll>
      <SectionCard title={t('main_info')}>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <FormField
              label={t('title')}
              value={value}
              onChangeText={onChange}
              error={errors.title?.message}
              placeholder={t('title_placeholder')}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <FormField
              label={t('description')}
              value={value}
              onChangeText={onChange}
              error={errors.description?.message}
              multiline
              placeholder={t('description_placeholder')}
            />
          )}
        />
      </SectionCard>

      <SectionCard title={t('sort_deadline')}>
        <View style={styles.inlineButtons}>
          <PrimaryButton label={watchedDate} onPress={() => openPicker('date')} variant="secondary" />
          <PrimaryButton label={watchedTime} onPress={() => openPicker('time')} variant="secondary" />
        </View>
        {(errors.dueDate?.message || errors.dueTime?.message) ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errors.dueDate?.message ?? errors.dueTime?.message}
          </Text>
        ) : null}
      </SectionCard>

      <Modal
        visible={Platform.OS === 'ios' && pickerMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerMode(null)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setPickerMode(null)}>
          <Pressable
            style={[styles.pickerModal, { backgroundColor: colors.surface }]}
            onPress={(event) => event.stopPropagation()}
          >
            {pickerMode ? (
              <DateTimePicker
                display="spinner"
                mode={pickerMode}
                value={pickerValue}
                is24Hour
                minimumDate={pickerMode === 'date' ? new Date() : undefined}
                onValueChange={handleDateChange}
              />
            ) : null}
            <PrimaryButton label={t('done')} onPress={() => setPickerMode(null)} />
          </Pressable>
        </Pressable>
      </Modal>

      <SectionCard title={t('location')}>
        <Text style={[styles.locationIntro, { color: colors.textMuted }]}>{t('search_any_city')}</Text>
        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value } }) => (
            <FormField
              label={t('address')}
              value={value}
              onChangeText={(nextAddress) => {
                onChange(nextAddress);
                setIsLocationResolved(false);
                setResolvedLocationName('');
              }}
              error={errors.address?.message}
              placeholder={t('city_or_full_address')}
            />
          )}
        />
        <PrimaryButton
          label={isSearchingLocation ? t('searching_address') : t('search_on_map')}
          onPress={() => void handleLocationSearch()}
          disabled={isSearchingLocation}
        />
        <View style={styles.quickLocationBlock}>
          <Text style={[styles.quickLocationLabel, { color: colors.textMuted }]}>{t('quick_locations')}</Text>
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
              <Text style={[styles.locationResultTitle, { color: colors.success }]}>{t('location_found')}</Text>
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

      <SectionCard title={t('status')}>
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
                    {getStatusLabel(status, language)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </SectionCard>

      <SectionCard title={t('assigned_to')}>
        <Text style={[styles.helperText, { color: colors.textMuted }]}>{t('assigned_to_help')}</Text>
        <Controller
          control={control}
          name="assignedToId"
          render={({ field: { value, onChange } }) => (
            <UserSelector value={value} onChange={onChange} />
          )}
        />
      </SectionCard>

      <SectionCard title={t('attachments')}>
        <PrimaryButton label={t('pick_images')} onPress={handlePickImages} variant="secondary" />
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

      <PrimaryButton label={task ? t('save_changes') : t('create_task')} onPress={onSubmit} disabled={isSubmitting} />
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
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
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
