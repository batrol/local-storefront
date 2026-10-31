<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Http\Requests\StockAdjustRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(
        private readonly ProductService $products,
        private readonly StockService $stock,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return ProductResource::collection($this->products->list($this->shopId($request)));
    }

    public function show(Request $request, int $id): ProductResource
    {
        return new ProductResource($this->products->find($this->shopId($request), $id));
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $product = $this->products->create($this->shopId($request), $request->validated());

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function update(ProductRequest $request, int $id): ProductResource
    {
        return new ProductResource($this->products->update($this->shopId($request), $id, $request->validated()));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->products->delete($this->shopId($request), $id);

        return response()->json(null, 204);
    }

    public function adjustStock(StockAdjustRequest $request, int $id): ProductResource
    {
        $product = $this->products->find($this->shopId($request), $id);

        return new ProductResource(
            $this->stock->adjust($product, $request->validated('delta'), $request->validated('reason')),
        );
    }
}
