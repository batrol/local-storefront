<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Http\Requests\OrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $status = OrderStatus::tryFrom((string) $request->query('status'));

        return OrderResource::collection($this->orders->list($this->shopId($request), $status));
    }

    public function show(Request $request, int $id): OrderResource
    {
        return new OrderResource($this->orders->find($this->shopId($request), $id));
    }

    public function updateStatus(OrderStatusRequest $request, int $id): OrderResource
    {
        $status = OrderStatus::from($request->validated('status'));

        return new OrderResource($this->orders->changeStatus($this->shopId($request), $id, $status));
    }
}
