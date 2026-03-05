import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontSize, spacing } from '../../theme';

const Input = ({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize = 'none', autoCorrect = false, returnKeyType, onSubmitEditing, leftIcon, rightIcon, onRightIconPress, error, hint, editable = true, multiline, numberOfLines = 1, style }) => {
    const [focused, setFocused] = useState(false);
    return (
        <View style={style}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.container, focused && styles.focused, error && styles.errored, !editable && { opacity: 0.5 }]}>
                {leftIcon && <Ionicons name={leftIcon} size={18} color={focused ? colors.primary : colors.textMuted} style={{ paddingLeft: 14 }} />}
                <TextInput
                    value={value} onChangeText={onChangeText} placeholder={placeholder}
                    placeholderTextColor={colors.textMuted} secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoCorrect={autoCorrect}
                    returnKeyType={returnKeyType} onSubmitEditing={onSubmitEditing} editable={editable}
                    multiline={multiline} numberOfLines={numberOfLines}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={[styles.input, leftIcon && { paddingLeft: 6 }, rightIcon && { paddingRight: 6 }, multiline && { height: numberOfLines * 42, textAlignVertical: 'top' }]}
                />
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={{ paddingHorizontal: 14 }}>
                        <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
            {error ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons name="alert-circle" size={12} color={colors.danger} />
                    <Text style={styles.error}>{error}</Text>
                </View>
            ) : hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.2 },
    container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.surfaceBorder, minHeight: 50 },
    focused: { borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
    errored: { borderColor: colors.danger },
    input: { flex: 1, fontSize: fontSize.base, color: colors.text, paddingHorizontal: 14, paddingVertical: 10 },
    error: { fontSize: fontSize.xs, color: colors.danger },
    hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
});

export default Input;
