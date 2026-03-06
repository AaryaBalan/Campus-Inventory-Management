import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assetsAPI } from '../../utils/api';
import { colors, spacing, fontSize } from '../../theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function AssetRegisterScreen({ navigation }) {
    const [form, setForm] = useState({ name: '', category: '', location: '', department: '', purchaseValue: '' });
    const [loading, setLoading] = useState(false);
    const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        if (!form.name || !form.category) { Alert.alert('Required Fields', 'Name and category are required.'); return; }
        setLoading(true);
        try {
            await assetsAPI.create({ ...form, purchaseValue: parseFloat(form.purchaseValue) || 0, condition: 'good', status: 'active' });
            Alert.alert('Success', 'Asset registered successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e) { Alert.alert('Error', e.message); }
        finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                <Text style={styles.backTxt}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Register Asset</Text>
            <Text style={styles.subtitle}>Add a new asset to the campus inventory</Text>

            <View style={styles.form}>
                <Input label="Asset Name *" value={form.name} onChangeText={set('name')} placeholder="e.g. Dell Inspiron Laptop" leftIcon="cube-outline" />
                <Input label="Category *" value={form.category} onChangeText={set('category')} placeholder="e.g. IT Equipment" leftIcon="folder-outline" />
                <Input label="Location" value={form.location} onChangeText={set('location')} placeholder="e.g. Block A - Room 204" leftIcon="location-outline" />
                <Input label="Department" value={form.department} onChangeText={set('department')} placeholder="e.g. Computer Science" leftIcon="business-outline" />
                <Input label="Purchase Value" value={form.purchaseValue} onChangeText={set('purchaseValue')} placeholder="₹0.00" keyboardType="numeric" leftIcon="cash-outline" />
            </View>

            <Button title="Register Asset" onPress={handleSubmit} loading={loading} leftIcon="add-circle-outline" />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.lg },
    backTxt: { fontSize: fontSize.base, color: colors.primary, fontWeight: '500' },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: 4 },
    subtitle: { fontSize: fontSize.base, color: colors.textSecondary, marginBottom: spacing.xl },
    form: { gap: 14, marginBottom: spacing.xl },
});
