import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../../theme';

const Loading = ({ message = 'Loading...', fullScreen = false }) => (
    <View style={[styles.container, fullScreen && styles.full]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    full: { flex: 1, backgroundColor: colors.background },
    text: { fontSize: fontSize.sm, color: colors.textSecondary },
});

export default Loading;
