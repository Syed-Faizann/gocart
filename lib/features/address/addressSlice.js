import { addressDummyData } from '@/assets/assets'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios' // Add this import

// FIX: Use createAsyncThunk properly
export const fetchAddresses = createAsyncThunk(
    'address/fetchAddresses', // Unique action type
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/address', {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data?.addresses || [] // Fixed: should be 'addresses' not 'addAddress'
        } catch (error) {
            console.error('Error fetching addresses:', error)
            return thunkAPI.rejectWithValue(error.response?.data || error.message)
        }
    }
)

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [addressDummyData],
        loading: false,
        error: null
    },
    reducers: {
        addAddress: (state, action) => {
            state.list.push(action.payload)
        },
        // Add more reducers if needed
        updateAddress: (state, action) => {
            const index = state.list.findIndex(addr => addr.id === action.payload.id)
            if (index !== -1) {
                state.list[index] = action.payload
            }
        },
        deleteAddress: (state, action) => {
            state.list = state.list.filter(addr => addr.id !== action.payload)
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAddresses.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload.length > 0 ? action.payload : [addressDummyData]
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
                console.error('Failed to fetch addresses:', action.payload)
            })
    }
})

export const { addAddress, updateAddress, deleteAddress } = addressSlice.actions
export default addressSlice.reducer