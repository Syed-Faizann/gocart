'use client'
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useAuth } from "@clerk/clerk-react"
import { useDispatch } from "react-redux"
import axios from "axios"
import { addAddress } from "@/lib/features/address/addressSlice"

const AddressModal = ({ setShowAddressModal }) => {
    const { getToken } = useAuth()
    const dispatch = useDispatch()

    const [address, setAddress] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: ''
    })

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()

            const { data } = await axios.post('/api/address', address, {
                headers: { Authorization: `Bearer ${token}` }
            })

            dispatch(addAddress(data.newAddress))
            toast.success(data.message)

            setShowAddressModal(false)
        } catch (error) {
            console.error(error)
            toast.error(error?.response?.data?.error || 'Failed to add address')
        }
    }

    return (
        <form 
            onSubmit={handleSubmit} 
            className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center"
        >
            <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm mx-6 bg-white p-8 rounded-lg shadow-lg">
                
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Add New Address</h2>
                    <XIcon 
                        size={24} 
                        className="text-slate-500 hover:text-slate-700 cursor-pointer"
                        onClick={() => setShowAddressModal(false)}
                    />
                </div>

                <input name="name" onChange={handleAddressChange} value={address.name} className="input" placeholder="Name" required />
                <input name="email" onChange={handleAddressChange} value={address.email} className="input" placeholder="Email" required />
                <input name="street" onChange={handleAddressChange} value={address.street} className="input" placeholder="Street" required />
                
                <div className="flex gap-4">
                    <input name="city" onChange={handleAddressChange} value={address.city} className="input" placeholder="City" required />
                    <input name="state" onChange={handleAddressChange} value={address.state} className="input" placeholder="State" required />
                </div>

                <div className="flex gap-4">
                    <input name="zip" onChange={handleAddressChange} value={address.zip} className="input" placeholder="Zip Code" required />
                    <input name="country" onChange={handleAddressChange} value={address.country} className="input" placeholder="Country" required />
                </div>

                <input name="phone" onChange={handleAddressChange} value={address.phone} className="input" placeholder="Phone" required />

                <button className="bg-slate-800 text-white text-sm font-medium py-3 rounded-md hover:bg-slate-900">
                    SAVE ADDRESS
                </button>
            </div>
        </form>
    )
}

export default AddressModal
