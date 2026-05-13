import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Card, Button, Loading } from '@/components/common';
import { useAppSelector, useAppDispatch } from '@/store';
import { unlinkConnection } from '@/store/slices/openBankingSlice';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { openBankingApi } from '@/api/openbanking.api';
import { BankTransaction } from '@/types/openbanking.types';
import LinearGradient from 'react-native-linear-gradient';
import { getRatingColor } from '@/utils';

type BankDetailScreenRouteProp = RouteProp<RootStackParamList, 'BankDetail'>;

const BankDetailScreen = ({ navigation }: { navigation: any }) => {
    const { colors } = useTheme();
    const route = useRoute<BankDetailScreenRouteProp>();
    const dispatch = useAppDispatch();
    const { connectionId } = route.params;

    // Lấy info account từ Redux Store (đã load ở màn trước)
    const { user } = useAppSelector(state => state.auth);
    const { connections, banks } = useAppSelector(state => state.openBanking);
    const account = connections.find(c => c.id === connectionId);
    const bank = banks.find(b => b.id === account?.bankId);

    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [loadingValues, setLoading] = useState(false);
    const [unlinking, setUnlinking] = useState(false);

    const [creditScore, setCreditScore] = useState<{
        score: number;
        rating: string;
        loanLimit: number;
    } | null>(null);
    const [loadingCreditScore, setLoadingCreditScore] = useState(false);

    useEffect(() => {
        loadTransactions();
        loadCreditScore();
    }, []);

    const loadTransactions = async () => {
        if (!user?._id) return;
        setLoading(true);
        try {
            // Gọi API lấy giao dịch (Actual user)
            const data = await openBankingApi.getTransactions(account?.id || 'demo_user');
            setTransactions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCreditScore = async () => {
        if (!user?._id) return;
        setLoadingCreditScore(true);
        try {
            // Gọi API lấy điểm tín dụng cho user hiện tại
            const data = await openBankingApi.getCreditScore(user._id);
            setCreditScore(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCreditScore(false);
        }
    };

    const handleUnlink = () => {
        if (!account) return;
        Alert.alert(
            '⚠️ Gỡ liên kết ngân hàng',
            `Bạn có chắc muốn gỡ liên kết tài khoản ${bank?.shortName || ''} (**** ${account.accountNumber.slice(-4)})?\n\nĐiểm tín dụng có thể bị ảnh hưởng sau khi gỡ liên kết.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Gỡ liên kết',
                    style: 'destructive',
                    onPress: async () => {
                        setUnlinking(true);
                        try {
                            await dispatch(unlinkConnection(connectionId)).unwrap();
                            Alert.alert(
                                '✅ Thành công',
                                'Đã gỡ liên kết ngân hàng thành công.',
                                [{ text: 'OK', onPress: () => navigation.goBack() }],
                            );
                        } catch (error: any) {
                            Alert.alert('❌ Lỗi', error || 'Không thể gỡ liên kết. Vui lòng thử lại.');
                        } finally {
                            setUnlinking(false);
                        }
                    },
                },
            ],
        );
    };

    if (!account) return <View style={styles.container}><Text>Không tìm thấy tài khoản</Text></View>;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={colors.textWhite} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Chi tiết tài khoản</Text>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={colors.textWhite} />
                </TouchableOpacity>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={loadingValues} onRefresh={loadTransactions} tintColor={colors.accentBlue} />}
                contentContainerStyle={{ padding: 20 }}
            >
                {/* Account Card */}
                <LinearGradient
                    colors={['#0f2027', '#203a43', '#2c5364']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={[styles.accountCard, { shadowColor: colors.accentBlue }]}
                >
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.logoContainer}>
                                <Image source={{ uri: bank?.logo || '' }} style={styles.logo} resizeMode="contain" />
                            </View>
                            <View>
                                <Text style={styles.bankName}>{bank?.shortName}</Text>
                                <Text style={styles.accountNumber}>**** {account.accountNumber.slice(-4)}</Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Active</Text>
                        </View>
                    </View>

                    <View style={styles.balanceContainer}>
                        <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                        <Text style={styles.balanceVal}>{formatCurrency(account.balance)}</Text>
                    </View>
                </LinearGradient>

                {/* Actions Grid (Optional) */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.darkSurface }]}>
                        <Ionicons name="swap-horizontal" size={24} color={colors.accentBlue} />
                        <Text style={[styles.actionText, { color: colors.textWhite }]}>Chuyển tiền</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.darkSurface }]}>
                        <Ionicons name="qr-code" size={24} color={colors.accentBlue} />
                        <Text style={[styles.actionText, { color: colors.textWhite }]}>Quét QR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.darkSurface }]}>
                        <Ionicons name="card" size={24} color={colors.accentBlue} />
                        <Text style={[styles.actionText, { color: colors.textWhite }]}>Thanh toán</Text>
                    </TouchableOpacity>
                </View>

                {/* Credit Score Card */}
                <View style={[styles.creditCard, { backgroundColor: colors.darkSurface }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textWhite, marginBottom: 12 }]}>
                        Điểm tín dụng
                    </Text>

                    {loadingCreditScore ? (
                        <ActivityIndicator color={colors.accentBlue} />
                    ) : creditScore ? (
                        <View style={styles.creditContent}>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreValue}>{creditScore.score}</Text>
                                <Text style={styles.scoreMax}>/1000</Text>
                            </View>
                            <View style={styles.creditInfo}>
                                <View style={[
                                    styles.ratingBadge,
                                    { backgroundColor: getRatingColor(creditScore.rating) }
                                ]}>
                                    <Text style={styles.ratingText}>{creditScore.rating}</Text>
                                </View>
                                <Text style={{ color: colors.textGray, marginTop: 8 }}>
                                    Hạn mức vay: {formatCurrency(creditScore.loanLimit)}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={{ color: colors.textGray }}>Chưa có điểm</Text>
                    )}
                </View>


                {/* Transactions */}
                <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Lịch sử giao dịch</Text>

                {loadingValues ? <Loading /> : (
                    transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textGray} />
                            <Text style={{ color: colors.textGray, textAlign: 'center', marginTop: 10 }}>Chưa có giao dịch nào</Text>
                        </View>
                    ) : (
                        transactions.map(tx => (
                            <View key={tx.id} style={[styles.transactionItem, { borderBottomColor: colors.darkBorder }]}>
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: tx.type === 'IN' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                                ]}>
                                    <Ionicons
                                        name={tx.type === 'IN' ? "arrow-down" : "arrow-up"}
                                        size={20}
                                        color={tx.type === 'IN' ? colors.greenSuccess : colors.redError}
                                    />
                                </View>

                                <View style={styles.transactionInfo}>
                                    <Text style={[styles.txDescription, { color: colors.textWhite }]}>{tx.description}</Text>
                                    <Text style={[styles.txDate, { color: colors.textGray }]}>{formatDate(new Date(tx.date))}</Text>
                                </View>

                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.type === 'IN' ? colors.greenSuccess : colors.textWhite }
                                ]}>
                                    {tx.type === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </Text>
                            </View>
                        ))
                    )
                )}

                {/* Gỡ liên kết */}
                <View style={[styles.unlinkSection, { backgroundColor: colors.darkSurface, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                    <View style={styles.unlinkHeader}>
                        <Ionicons name="link-outline" size={22} color={colors.redError} />
                        <Text style={[styles.unlinkTitle, { color: colors.redError }]}>Gỡ liên kết</Text>
                    </View>
                    <Text style={[styles.unlinkDescription, { color: colors.textGray }]}>
                        Gỡ liên kết tài khoản ngân hàng này khỏi ứng dụng. Điểm tín dụng của bạn có thể bị ảnh hưởng.
                    </Text>
                    <TouchableOpacity
                        style={[styles.unlinkButton, unlinking && { opacity: 0.6 }]}
                        onPress={handleUnlink}
                        disabled={unlinking}
                        activeOpacity={0.7}
                    >
                        {unlinking ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="trash-outline" size={18} color="#fff" />
                                <Text style={styles.unlinkButtonText}>Gỡ liên kết ngân hàng</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },

    accountCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    logo: { width: 30, height: 30 },
    bankName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    accountNumber: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 2,
    },
    statusBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        height: 26,
    },
    statusText: {
        color: '#4ade80',
        fontSize: 12,
        fontWeight: '600',
    },
    balanceContainer: {},
    balanceLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    balanceVal: {
        color: 'white',
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 1,
    },

    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionItem: {
        width: '31%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '500',
    },

    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    transactionInfo: {
        flex: 1,
    },
    txDescription: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    txDate: {
        fontSize: 12,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: 'bold',
    },

    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },

    creditCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    creditContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    scoreValue: {
        color: '#3b82f6',
        fontSize: 24,
        fontWeight: 'bold',
    },
    scoreMax: {
        color: 'rgba(59, 130, 246, 0.6)',
        fontSize: 12,
    },
    creditInfo: {
        flex: 1,
    },
    ratingBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    ratingText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },

    // Unlink section
    unlinkSection: {
        marginTop: 24,
        marginBottom: 40,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    unlinkHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    unlinkTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    unlinkDescription: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 16,
    },
    unlinkButton: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    unlinkButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default BankDetailScreen;