<?php

namespace App\Http\Controllers;

use App\Models\Outillage;
use Illuminate\Http\Request;

class OutillageController extends Controller
{
    public function index()
    {
        return response()->json(Outillage::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $item = Outillage::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = Outillage::findOrFail($id);
        return response()->json($item, 200);
    }

    public function update(Request $request, $id)
    {
        $item = Outillage::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);
        $item->update($validated);
        return response()->json($item, 200);
    }

    public function destroy($id)
    {
        $item = Outillage::findOrFail($id);
        $item->delete();
        return response()->json(null, 204);
    }
}
