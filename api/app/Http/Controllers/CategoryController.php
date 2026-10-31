<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categories) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return CategoryResource::collection($this->categories->list($this->shopId($request)));
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $category = $this->categories->create($this->shopId($request), $request->validated('name'));

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function update(CategoryRequest $request, int $id): CategoryResource
    {
        return new CategoryResource($this->categories->update($this->shopId($request), $id, $request->validated('name')));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->categories->delete($this->shopId($request), $id);

        return response()->json(null, 204);
    }
}
