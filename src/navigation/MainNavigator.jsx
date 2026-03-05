import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize } from '../theme';
import { useAuth } from '../context/AuthContext';

// Dashboards
import AdminDashboard from '../screens/dashboard/AdminDashboard';
import FinanceDashboard from '../screens/dashboard/FinanceDashboard';
import InventoryDashboard from '../screens/dashboard/InventoryDashboard';
import DepartmentDashboard from '../screens/dashboard/DepartmentDashboard';
import AuditorDashboard from '../screens/dashboard/AuditorDashboard';
import ExecutiveDashboard from '../screens/dashboard/ExecutiveDashboard';

// Screens
import AssetListScreen from '../screens/assets/AssetListScreen';
import AssetDetailScreen from '../screens/assets/AssetDetailScreen';
import AssetRegisterScreen from '../screens/assets/AssetRegisterScreen';
import StockLevelsScreen from '../screens/inventory/StockLevelsScreen';
import InventoryDetailScreen from '../screens/inventory/InventoryDetailScreen';
import PurchaseRequestScreen from '../screens/procurement/PurchaseRequestScreen';
import ApprovalQueueScreen from '../screens/procurement/ApprovalQueueScreen';
import PurchaseHistoryScreen from '../screens/procurement/PurchaseHistoryScreen';
import AnalyticsDashboard from '../screens/analytics/AnalyticsDashboardScreen';
import AlertsPanelScreen from '../screens/alerts/AlertsPanelScreen';
import QRScannerScreen from '../screens/scanner/QRScannerScreen';
import BillExtractorScreen from '../screens/bills/BillExtractorScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DASHBOARD_MAP = {
    admin: AdminDashboard,
    finance: FinanceDashboard,
    inventory: InventoryDashboard,
    department: DepartmentDashboard,
    auditor: AuditorDashboard,
    executive: ExecutiveDashboard,
};

const TAB_ICONS = {
    Dashboard: { on: 'grid', off: 'grid-outline' },
    Assets: { on: 'cube', off: 'cube-outline' },
    Procurement: { on: 'document-text', off: 'document-text-outline' },
    Analytics: { on: 'bar-chart', off: 'bar-chart-outline' },
    More: { on: 'apps', off: 'apps-outline' },
};

// Assets stack
function AssetsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AssetList" component={AssetListScreen} />
            <Stack.Screen name="AssetDetail" component={AssetDetailScreen} />
            <Stack.Screen name="AssetRegister" component={AssetRegisterScreen} />
            <Stack.Screen name="StockLevels" component={StockLevelsScreen} />
            <Stack.Screen name="InventoryDetail" component={InventoryDetailScreen} />
        </Stack.Navigator>
    );
}

// Procurement stack
function ProcurementStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
            <Stack.Screen name="ApprovalQueue" component={ApprovalQueueScreen} />
            <Stack.Screen name="PurchaseRequest" component={PurchaseRequestScreen} />
        </Stack.Navigator>
    );
}

// More tab stack
function MoreStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MoreMenu" component={MoreMenuScreen} />
            <Stack.Screen name="Alerts" component={AlertsPanelScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="BillExtractor" component={BillExtractorScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
    );
}

// More menu placeholder
function MoreMenuScreen({ navigation }) {
    const items = [
        { label: 'Alerts', icon: 'alert-circle-outline', screen: 'Alerts', color: colors.warning },
        { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', color: colors.primary },
        { label: 'QR Scanner', icon: 'qr-code-outline', screen: 'QRScanner', color: colors.success },
        { label: 'Bill Extractor', icon: 'receipt-outline', screen: 'BillExtractor', color: colors.secondary },
        { label: 'Profile', icon: 'person-circle-outline', screen: 'Profile', color: colors.info },
    ];
    return (
        <View style={more.container}>
            <Text style={more.header}>More</Text>
            {items.map(item => (
                <View key={item.screen} style={more.item}>
                    <View style={[more.iconWrap, { backgroundColor: `${item.color}15` }]}>
                        <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={more.itemLabel} onPress={() => navigation.navigate(item.screen)}>
                        {item.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
            ))}
        </View>
    );
}

const more = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 20 },
    header: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: 24 },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.cardBorder, gap: 14 },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    itemLabel: { flex: 1, fontSize: fontSize.base, fontWeight: '600', color: colors.text },
});

export default function MainNavigator() {
    const { userRole } = useAuth();
    const DashboardScreen = DASHBOARD_MAP[userRole] || AdminDashboard;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: styles.tabLabel,
                tabBarIcon: ({ focused, color, size }) => {
                    const icons = TAB_ICONS[route.name] || { on: 'apps', off: 'apps-outline' };
                    return (
                        <View style={[styles.iconWrap, focused && styles.iconActive]}>
                            <Ionicons name={focused ? icons.on : icons.off} size={size - 2} color={color} />
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Assets" component={AssetsStack} />
            <Tab.Screen name="Procurement" component={ProcurementStack} />
            <Tab.Screen name="Analytics" component={AnalyticsDashboard} />
            <Tab.Screen name="More" component={MoreStack} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: { backgroundColor: colors.surface, borderTopColor: 'rgba(255,255,255,0.06)', borderTopWidth: 1, height: 68, paddingBottom: 10, paddingTop: 8 },
    tabLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
    iconWrap: { width: 36, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
    iconActive: { backgroundColor: 'rgba(6,229,255,0.12)' },
});
