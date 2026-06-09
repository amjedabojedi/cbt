import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/api';

const { width } = Dimensions.get('window');

interface UserManagementScreenProps {
  navigation: any;
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  therapist: '#8B5CF6',
  client: '#10B981',
};

const ROLE_BG: Record<string, string> = {
  admin: '#FEF2F2',
  therapist: '#F5F3FF',
  client: '#F0FDF4',
};

export default function UserManagementScreen({ navigation }: UserManagementScreenProps) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'therapist' | 'client'>('all');

  // Create user modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'client' | 'therapist' | 'admin'>('client');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await ApiService.getAllUsers();
      setUsers(res.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUsers();
    }, [fetchUsers])
  );

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string, username: string) => {
    const display = name || username || '';
    const parts = display.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return display.slice(0, 2).toUpperCase();
  };

  const handleCreateUser = async () => {
    if (!createEmail || !createPassword || !createUsername) {
      Alert.alert('Validation', 'Please fill in email, username, and password.');
      return;
    }
    setCreating(true);
    try {
      const res = await ApiService.registerByAdmin({
        name: createName,
        email: createEmail,
        username: createUsername,
        password: createPassword,
        role: createRole,
      });
      if (res.error) {
        Alert.alert('Error', res.error);
      } else {
        setCreateModalVisible(false);
        setCreateName('');
        setCreateEmail('');
        setCreateUsername('');
        setCreatePassword('');
        setCreateRole('client');
        fetchUsers();
        Alert.alert('Success', 'User created successfully.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditRole(user.role);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await ApiService.updateUser(editingUser.id, {
        name: editName,
        role: editRole,
      });
      if (res.error) {
        Alert.alert('Error', res.error);
      } else {
        setEditModalVisible(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (user: any) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name || user.username}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await ApiService.deleteUser(user.id);
            if (res.error) {
              Alert.alert('Error', res.error);
            } else {
              fetchUsers();
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = (user: any) => {
    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            const res = await ApiService.resetUserPassword(user.id);
            if (res.error) {
              Alert.alert('Error', res.error);
            } else {
              Alert.alert('Sent', 'Password reset email sent.');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.userCard, index === 0 && { marginTop: 0 }]}>
      <View style={styles.userRow}>
        <View style={[styles.avatar, { backgroundColor: ROLE_BG[item.role] || '#F8FAFC' }]}>
          <Text style={[styles.avatarText, { color: ROLE_COLORS[item.role] || '#64748B' }]}>
            {getInitials(item.name, item.username)}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.userName}>{item.name || item.username}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.roleBadgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: ROLE_BG[item.role] || '#F8FAFC' }]}>
              <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[item.role] || '#64748B' }]}>
                {item.role}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenEdit(item)}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={14} color="#8B5CF6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { marginTop: 6 }]}
            onPress={() => handleResetPassword(item)}
            activeOpacity={0.7}
          >
            <Feather name="key" size={14} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { marginTop: 6 }]}
            onPress={() => handleDeleteUser(item)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSub}>{users.length} total users</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="user-plus" size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Filter */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#94A3B8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Role Filter Chips */}
      <View style={styles.chipRow}>
        {(['all', 'admin', 'therapist', 'client'] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.chip, roleFilter === role && styles.chipActive]}
            onPress={() => setRoleFilter(role)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, roleFilter === role && styles.chipTextActive]}>
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="users" size={40} color="#CBD5E1" />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create User Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New User</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.fieldInput} placeholder="e.g. John Doe" placeholderTextColor="#94A3B8" value={createName} onChangeText={setCreateName} />

              <Text style={styles.fieldLabel}>Email *</Text>
              <TextInput style={styles.fieldInput} placeholder="user@example.com" placeholderTextColor="#94A3B8" value={createEmail} onChangeText={setCreateEmail} autoCapitalize="none" keyboardType="email-address" />

              <Text style={styles.fieldLabel}>Username *</Text>
              <TextInput style={styles.fieldInput} placeholder="username" placeholderTextColor="#94A3B8" value={createUsername} onChangeText={setCreateUsername} autoCapitalize="none" />

              <Text style={styles.fieldLabel}>Password *</Text>
              <TextInput style={styles.fieldInput} placeholder="password" placeholderTextColor="#94A3B8" value={createPassword} onChangeText={setCreatePassword} secureTextEntry />

              <Text style={styles.fieldLabel}>Role *</Text>
              <View style={styles.rolePickerRow}>
                {(['client', 'therapist', 'admin'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePick, createRole === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]}
                    onPress={() => setCreateRole(r)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.rolePickText, createRole === r && { color: '#FFFFFF' }]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, creating && { opacity: 0.7 }]}
                onPress={handleCreateUser}
                disabled={creating}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Create User</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput style={styles.fieldInput} placeholder="Full name" placeholderTextColor="#94A3B8" value={editName} onChangeText={setEditName} />

            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.rolePickerRow}>
              {(['client', 'therapist', 'admin'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolePick, editRole === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]}
                  onPress={() => setEditRole(r)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.rolePickText, editRole === r && { color: '#FFFFFF' }]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveEdit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  addButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#090514',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginLeft: 6 },

  filterRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#F1F5F9',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1E293B' },

  chipRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#090514', borderColor: '#090514' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9',
    padding: 14, marginTop: 10,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: 'bold' },
  userName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  roleBadgeRow: { flexDirection: 'row', marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  userActions: { alignItems: 'center' },
  actionBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6, marginTop: 14 },
  fieldInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC',
  },
  rolePickerRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rolePick: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  rolePickText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  submitBtn: {
    backgroundColor: '#090514', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 10,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
