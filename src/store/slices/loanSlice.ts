import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loanApi } from '../../api/loan.api';

// Async thunks
export const fetchMyLoans = createAsyncThunk('loans/fetchMyLoans', async () => {
    return loanApi.getMyLoans();
});

export const fetchPendingRequests = createAsyncThunk('loans/fetchPending', async () => {
    return loanApi.getPendingRequests();
});

export const fetchMyInvestments = createAsyncThunk('loans/fetchInvestments', async () => {
    return loanApi.getMyInvestments();
});

const loanSlice = createSlice({
    name: 'loans',
    initialState: {
        myLoans: [] as any[],
        pendingRequests: [] as any[],
        myInvestments: [] as any[],
        isLoading: false,
        error: null as string | null,
    },
    reducers: {
        clearError: (state) => { state.error = null; },
        resetLoan: (state) => {
            state.myLoans = [];
            state.pendingRequests = [];
            state.myInvestments = [];
            state.isLoading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchMyLoans
            .addCase(fetchMyLoans.pending, (state) => { state.isLoading = true; })
            .addCase(fetchMyLoans.fulfilled, (state, action) => {
                state.isLoading = false;
                state.myLoans = action.payload;
            })
            .addCase(fetchMyLoans.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Lỗi tải danh sách khoản vay';
            })
            // fetchPendingRequests
            .addCase(fetchPendingRequests.pending, (state) => { state.isLoading = true; })
            .addCase(fetchPendingRequests.fulfilled, (state, action) => {
                state.isLoading = false;
                state.pendingRequests = action.payload;
            })
            .addCase(fetchPendingRequests.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Lỗi tải yêu cầu vay';
            })
            // fetchMyInvestments
            .addCase(fetchMyInvestments.pending, (state) => { state.isLoading = true; })
            .addCase(fetchMyInvestments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.myInvestments = action.payload;
            })
            .addCase(fetchMyInvestments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Lỗi tải danh sách đầu tư';
            });
    },
});

export const { clearError, resetLoan } = loanSlice.actions;
export default loanSlice.reducer;
