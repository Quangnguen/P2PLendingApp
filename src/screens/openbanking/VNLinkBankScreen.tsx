import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "@/providers";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Bank } from "@/types";
import { loadConnections, useAppDispatch, useAppSelector, useToast } from "@/store";
import { useEffect, useState } from "react";
import { initiateLinkBank, recalculateCreditScore, resetLinkState, verifyOtpLink } from "@/store/slices/openBankingSlice";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Loading } from "@/components/common";
import Ionicons from "react-native-vector-icons/Ionicons";

const VNLinkBankScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const bank = route.params.bank as Bank;
    const toast = useToast();

    const dispatch = useAppDispatch();
    const { isLoading, error, linkTransactionId } = useAppSelector((state) => state.openBanking);

    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        dispatch(resetLinkState());
    }, [])

    useEffect(() => {
        if (linkTransactionId) {
            setStep(2);
        }
    }, [linkTransactionId]);

    const handleLogin = async () => {
        if (!username || !password) {
            toast.error('Vui lòng nhập số tài khoản và tên chủ tài khoản');
            return;
        }

        // Debug: xem bank object chứa gì
        console.log('=== BANK OBJECT ===', JSON.stringify(bank));

        const bankCode = bank.code || bank.bin || bank.shortName;
        if (!bankCode) {
            toast.error('Không xác định được mã ngân hàng');
            return;
        }

        dispatch(initiateLinkBank({
            bankCode,
            accountNumber: username,
            accountName: password,
        }));
    }

    const handleVerifyOtp = async () => {
        if (!otp || !linkTransactionId) {
            return;
        }

        const resultAction = await dispatch(verifyOtpLink({
            transactionId: linkTransactionId,
            otp,
        }));

        if (verifyOtpLink.fulfilled.match(resultAction)) {
            // Trigger tính lại điểm tín dụng ngay sau khi liên kết thành công (async, không block)
            dispatch(recalculateCreditScore()).catch(() => {}); // silent fail nếu lỗi
            dispatch(loadConnections()); // Reload danh sách account ngay

            Alert.alert('Thành công', 'Liên kết tài khoản thành công!', [
                {
                    text: 'OK',
                    onPress: () => {
                        navigation.navigate('Main', { screen: 'HomeTab' } as any);
                    }
                }
            ]);
        }
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.textWhite} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
                    Liên kết tài khoản
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    <View style={styles.bankInfoContainer}>
                        <View style={[styles.logoContainer, { shadowColor: colors.accentBlue }]}>
                            <Image source={{ uri: bank?.logo }} style={styles.logo} resizeMode="contain" />
                        </View>
                        <Text style={[styles.bankName, { color: colors.textWhite }]}>{bank?.shortName}</Text>
                        <Text style={[styles.secureText, { color: colors.greenSuccess }]}>
                            <Ionicons name="shield-checkmark" size={14} color={colors.greenSuccess} /> Kết nối bảo mật
                        </Text>
                    </View>

                    <Card style={[styles.formCard, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
                        {step === 1 ? (
                            <>
                                <Text style={[styles.stepTitle, { color: colors.textWhite }]}>Nhập thông tin tài khoản</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textGray }]}>Số tài khoản</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.darkBackground, borderColor: colors.darkBorder }]}>
                                        <Ionicons name="card-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textWhite }]}
                                            value={username}
                                            onChangeText={setUsername}
                                            placeholder="Nhập số tài khoản ngân hàng"
                                            placeholderTextColor={colors.textGray + '80'}
                                            autoCapitalize="none"
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.textGray }]}>Tên chủ tài khoản</Text>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.darkBackground, borderColor: colors.darkBorder }]}>
                                        <Ionicons name="person-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textWhite }]}
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="VD: NGUYEN VAN A"
                                            placeholderTextColor={colors.textGray + '80'}
                                            autoCapitalize="characters"
                                        />
                                    </View>
                                </View>

                                {error && (
                                    <View style={styles.errorContainer}>
                                        <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text style={styles.errorText}>{error}</Text>
                                    </View>
                                )}

                                <Button
                                    title="Liên kết ngay"
                                    onPress={handleLogin}
                                    loading={isLoading}
                                    style={styles.submitButton}
                                />

                                <Text style={[styles.noteText, { color: colors.textGray }]}>
                                    Bằng việc liên kết, bạn đồng ý chia sẻ thông tin tài khoản với ứng dụng.
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.stepTitle, { color: colors.textWhite }]}>Xác thực OTP</Text>
                                <Text style={[styles.otpDesc, { color: colors.textGray }]}>
                                    Vui lòng nhập mã OTP được gửi đến số điện thoại đăng ký của bạn. (Mặc định: 123456)
                                </Text>

                                <View style={styles.inputGroup}>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.darkBackground, borderColor: colors.darkBorder }]}>
                                        <Ionicons name="keypad-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textWhite, fontSize: 18, letterSpacing: 2 }]}
                                            value={otp}
                                            onChangeText={setOtp}
                                            placeholder="000000"
                                            placeholderTextColor={colors.textGray + '80'}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </View>
                                </View>

                                {error && <Text style={styles.errorText}>{error}</Text>}

                                <Button
                                    title="Xác thực"
                                    onPress={handleVerifyOtp}
                                    loading={isLoading}
                                    style={styles.submitButton}
                                />
                            </>
                        )}
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600'
    },
    content: {
        padding: 24,
        paddingTop: 40,
        alignItems: 'center'
    },
    bankInfoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'white',
        marginBottom: 16,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    bankName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    secureText: {
        fontSize: 14,
        fontWeight: '500',
    },
    formCard: {
        width: '100%',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
    },
    submitButton: {
        marginTop: 8,
        borderRadius: 12,
    },
    noteText: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
    otpDesc: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    }
});
export default VNLinkBankScreen;