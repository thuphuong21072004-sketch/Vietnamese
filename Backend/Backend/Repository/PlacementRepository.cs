using Backend.Models;

namespace Backend.Repository
{
    public interface PlacementRepository
    {
        Task<List<PlacementTest>> GetPlacements();

        Task<PlacementTest?> GetPlacementById(int id);

        Task AddPlacement(PlacementTest placement);

        Task DeletePlacement(PlacementTest placement);

        Task Save();
    }
}
