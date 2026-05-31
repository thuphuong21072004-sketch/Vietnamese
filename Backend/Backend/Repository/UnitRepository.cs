using Backend.Models;

namespace Backend.Repository
{
    public interface UnitRepository
    {
        Task<List<Unit>> GetAllUnits(int courseId, bool? isActive);
        Task<List<Unit>> GetAllUnits(int courseId, bool isActive);
        Task<List<Unit>> GetUnitsByIds(List<int> ids);
        Task<Unit> GetUnitById(int unitId);
        Task AddUnit(Unit unit);
        Task UpdateUnit(Unit unit);
        Task DeleteUnits(List<int> ids, string refType);
        Task<int> GetMaxOrderIndex(int courseId);
        Task SaveUnit();
    }
}