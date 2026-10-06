'use client'
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import axios from "axios"

export default function Dashboard() {
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: 0,
        totalOrders: 0,
        ratings: [],
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon },
        { title: 'Total Earnings', value: currency + dashboardData.totalEarnings, icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.totalOrders, icon: TagsIcon },
        { title: 'Total Ratings', value: dashboardData.ratings.length, icon: StarIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data?.dashboardData) {
                setDashboardData(data.dashboardData)
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Seller <span className="text-slate-800 font-medium">Dashboard</span></h1>

            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-11 border border-slate-200 p-3 px-6 rounded-lg">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            <h2 className="text-lg font-medium text-slate-700">Total Reviews</h2>

            <div className="mt-5">
                {dashboardData.ratings.length === 0 ? (
                    <p className="text-slate-400 text-sm mt-3">No reviews yet for your products.</p>
                ) : (
                    dashboardData.ratings.map((review, index) => (
                        <div key={index} className="flex max-sm:flex-col gap-5 sm:items-center justify-between py-6 border-b border-slate-200 text-sm text-slate-600 max-w-4xl">
                            <div>
                                <div className="flex gap-3 items-center">
                                    {review.user?.image ? (
                                        <Image
                                            src={review.user.image}
                                            alt={review.user.name || "User"}
                                            className="w-10 h-10 rounded-full object-cover"
                                            width={100}
                                            height={100}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
                                            {review.user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{review.user?.name || "Customer"}</p>
                                        <p className="font-light text-slate-500 text-xs">
                                            {review.createdAt ? new Date(review.createdAt).toDateString() : ""}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-3 text-slate-500 max-w-xs leading-6">{review.review}</p>
                            </div>
                            <div className="flex flex-col justify-between gap-6 sm:items-end">
                                <div className="flex flex-col sm:items-end">
                                    <p className="text-slate-400">{review.product?.category}</p>
                                    <p className="font-medium">{review.product?.name}</p>
                                    <div className='flex items-center'>
                                        {Array(5).fill('').map((_, i) => (
                                            <StarIcon
                                                key={i}
                                                size={17}
                                                className='text-transparent mt-0.5'
                                                fill={review.rating >= i + 1 ? "#00C950" : "#D1D5DB"}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {review.product?.id && (
                                    <button
                                        onClick={() => router.push(`/product/${review.product.id}`)}
                                        className="bg-slate-100 px-5 py-2 hover:bg-slate-200 rounded transition-all cursor-pointer"
                                    >
                                        View Product
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}