<?php

namespace App\Http\Controllers;

use App\Models\ZoneOccupee;
use Illuminate\Http\Request;

class ZoneOccupeeController extends Controller
{
    public function index()
    {
        return response()->json(ZoneOccupee::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $item = ZoneOccupee::create($validated);
        return response()->json($item, 201);
    }

    public function show($id)
    {
        $item = ZoneOccupee::findOrFail($id);
        return response()->json($item, 200);
    }

    public function update(Request $request, $id)
    {
        $item = ZoneOccupee::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);
        $item->update($validated);
        return response()->json($item, 200);
    }

    public function destroy($id)
    {
        $item = ZoneOccupee::findOrFail($id);
        $item->delete();
        return response()->json(null, 204);
    }
}
