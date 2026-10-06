'use client'
import ProductCard from "@/components/ProductCard"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MailIcon, MapPinIcon } from "lucide-react"
import Loading from "@/components/Loading"
import Image from "next/image"
import toast from "react-hot-toast"
import axios from "axios"

export default function StoreShop() {
    const { username } = useParams()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStoreData = async () => {
        try {
            const { data } = await axios.get(`/api/store/data?username=${username}`)
            setStoreInfo(data.store)
            setProducts(data.store?.Product || [])
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (username) {
            fetchStoreData()
        }
    }, [username])

    if (loading) return <Loading />

    if (!storeInfo) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500">
                <h1 className="text-2xl font-semibold">Store not found</h1>
                <p className="mt-2 text-sm text-slate-400">The store you are looking for does not exist or is inactive.</p>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] mx-6">
            {/* Store Info Banner */}
            <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                {storeInfo.logo ? (
                    <Image
                        src={storeInfo.logo}
                        alt={storeInfo.name}
                        className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
                        width={200}
                        height={200}
                    />
                ) : (
                    <div className="size-32 sm:size-38 bg-slate-200 rounded-md flex items-center justify-center text-slate-500 font-bold text-3xl">
                        {storeInfo.name?.[0]?.toUpperCase() || 'S'}
                    </div>
                )}
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-semibold text-slate-800">{storeInfo.name}</h1>
                    <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeInfo.description}</p>
                    <div className="space-y-2 text-sm text-slate-500 mt-4">
                        {storeInfo.address && (
                            <div className="flex items-center justify-center md:justify-start">
                                <MapPinIcon className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                                <span>{storeInfo.address}</span>
                            </div>
                        )}
                        {storeInfo.email && (
                            <div className="flex items-center justify-center md:justify-start">
                                <MailIcon className="w-4 h-4 text-gray-500 mr-2 shrink-0" />
                                <span>{storeInfo.email}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Products */}
            <div className="max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                {products.length === 0 ? (
                    <p className="text-slate-400 text-sm mt-4">No products available in this store yet.</p>
                ) : (
                    <div className="mt-5 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto">
                        {products.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                )}
            </div>
        </div>
    )
}