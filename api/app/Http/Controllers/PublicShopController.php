<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PublicProductResource;
use App\Http\Resources\ShopResource;
use App\Services\OrderService;
use App\Services\PublicShopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicShopController extends Controller
{
    public function __construct(
        private readonly PublicShopService $shops,
        private readonly OrderService $orders,
    ) {}

    public function show(string $slug): ShopResource
    {
        return new ShopResource($this->shops->shop($slug));
    }

    public function products(string $slug): AnonymousResourceCollection
    {
        return PublicProductResource::collection($this->shops->catalog($this->shops->shop($slug)));
    }

    public function order(OrderRequest $request, string $slug): JsonResponse
    {
        $order = $this->orders->create($this->shops->shop($slug), $request->validated());

        return (new OrderResource($order))->response()->setStatusCode(201);
    }
}
