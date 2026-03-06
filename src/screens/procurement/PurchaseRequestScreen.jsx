import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { procurementAPI } from '../../utils/api';
import apiClient from '../../utils/api';
import { colors, spacing, fontSize } from '../../theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function PurchaseRequestScreen({ navigation }) {
    const [form, setForm] = useState({ title: '', description: '', department: '', estimatedCost: '', items: '' });
    const [loading, setLoading] = useState(false);
    const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        if (!form.title || !form.department) { Alert.alert('Required', 'Title and department are required.'); return; }
        setLoading(true);
        try {
            const pr = await procurementAPI.create({
                ...form,
                estimatedCost: parseFloat(form.estimatedCost) || 0,
                status: 'submitted' // API create often handles submission or we can call separate submit
            });
            Alert.alert('Submitted!', 'Your purchase request has been submitted for approval.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (e) { Alert.alert('Error', e.message); }
        finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                <Text style={styles.backTxt}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New Purchase Request</Text>
            <Text style={styles.sub}>Fill in the details for the procurement request</Text>

            <View style={styles.form}>
                <Input label="Title *" value={form.title} onChangeText={set('title')} placeholder="e.g. Office Supplies Q2" leftIcon="document-text-outline" />
                <Input label="Department *" value={form.department} onChangeText={set('department')} placeholder="e.g. Computer Science" leftIcon="business-outline" />
                <Input label="Estimated Cost" value={form.estimatedCost} onChangeText={set('estimatedCost')} placeholder="₹0.00" keyboardType="numeric" leftIcon="cash-outline" />
                <Input label="Item List" value={form.items} onChangeText={set('items')} placeholder="List items separated by commas" leftIcon="list-outline" multiline numberOfLines={3} />
                <Input label="Description" value={form.description} onChangeText={set('description')} placeholder="Additional notes…" leftIcon="create-outline" multiline numberOfLines={3} />
            </View>

            <Button title="Submit Request" onPress={handleSubmit} loading={loading} leftIcon="send-outline" />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.lg },
    backTxt: { fontSize: fontSize.base, color: colors.primary, fontWeight: '500' },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: 4 },
    sub: { fontSize: fontSize.base, color: colors.textSecondary, marginBottom: spacing.xl },
    form: { gap: 14, marginBottom: spacing.xl },
});
