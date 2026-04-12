<?php

namespace App\Http\Controllers;

use App\Models\TypeActivite;
use Illuminate\Http\Request;

class TypeActiviteController extends Controller
{
    public function index()
    {
        return response()->json(TypeActivite::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $item = TypeActivite::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = TypeActivite::findOrFail($id);
        return response()->json($item, 200);
    }

    public function update(Request $request, $id)
    {
        $item = TypeActivite::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);
        $item->update($validated);
        return response()->json($item, 200);
    }

    public function destroy($id)
    {
        $item = TypeActivite::findOrFail($id);
        $item->delete();
        return response()->json(null, 204);
    }
}
