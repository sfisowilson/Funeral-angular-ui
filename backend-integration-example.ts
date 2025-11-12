// Backend integration example for team members
// This shows how team member data should be integrated with the backend

// 1. Create a Team/TeamMember model in the backend
public class TeamMember
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    public string? Department { get; set; }
    public string? Bio { get; set; }
    public string Status { get; set; } = "active";
    public DateTime DateAdded { get; set; } = DateTime.UtcNow;
    public Guid TenantId { get; set; }
}

// 2. Create a TeamMemberController
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TeamMemberController : ControllerBase
{
    private readonly ITeamMemberService _teamMemberService;
    private readonly ITenantProvider _tenantProvider;

    [HttpGet("TeamMember_GetAllTeamMembers")]
    public async Task<ActionResult<List<TeamMemberDto>>> GetAllTeamMembers()
    {
        var tenantId = _tenantProvider.tenantId;
        var teamMembers = await _teamMemberService.GetTeamMembersAsync(tenantId);
        return Ok(teamMembers);
    }

    [HttpPost("TeamMember_CreateTeamMember")]
    public async Task<ActionResult<TeamMemberDto>> CreateTeamMember([FromBody] CreateTeamMemberDto dto)
    {
        var tenantId = _tenantProvider.tenantId;
        var teamMember = await _teamMemberService.CreateTeamMemberAsync(dto, tenantId);
        return Ok(teamMember);
    }

    [HttpPut("TeamMember_UpdateTeamMember/{id}")]
    public async Task<ActionResult<TeamMemberDto>> UpdateTeamMember(Guid id, [FromBody] UpdateTeamMemberDto dto)
    {
        var tenantId = _tenantProvider.tenantId;
        var teamMember = await _teamMemberService.UpdateTeamMemberAsync(id, dto, tenantId);
        return Ok(teamMember);
    }

    [HttpDelete("TeamMember_DeleteTeamMember/{id}")]
    public async Task<ActionResult> DeleteTeamMember(Guid id)
    {
        var tenantId = _tenantProvider.tenantId;
        await _teamMemberService.DeleteTeamMemberAsync(id, tenantId);
        return NoContent();
    }
}

// 3. Frontend service to connect to backend
@Injectable({
  providedIn: 'root'
})
export class TeamMemberService {
  constructor(private http: HttpClient) {}

  getTeamMembers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>('/api/TeamMember/TeamMember_GetAllTeamMembers');
  }

  createTeamMember(member: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.post<TeamMember>('/api/TeamMember/TeamMember_CreateTeamMember', member);
  }

  updateTeamMember(id: string, member: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.put<TeamMember>(`/api/TeamMember/TeamMember_UpdateTeamMember/${id}`, member);
  }

  deleteTeamMember(id: string): Observable<void> {
    return this.http.delete<void>(`/api/TeamMember/TeamMember_DeleteTeamMember/${id}`);
  }
}

// 4. Updated team editor component to use backend service
export class TeamEditorComponent implements OnInit {
  constructor(
    private teamMemberService: TeamMemberService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadTeamMembersFromBackend();
  }

  loadTeamMembersFromBackend(): void {
    this.teamMemberService.getTeamMembers().subscribe({
      next: (members) => {
        this.teamMembers = members;
        this.filteredTeamMembers = [...members];
        this.config.settings.teamMembers = members;
      },
      error: (error) => {
        console.error('Failed to load team members:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load team members'
        });
      }
    });
  }

  saveTeamMemberToBackend(member: TeamMember): void {
    if (member.id && member.id !== '') {
      // Update existing member
      this.teamMemberService.updateTeamMember(member.id, member).subscribe({
        next: (updatedMember) => {
          const index = this.teamMembers.findIndex(m => m.id === member.id);
          if (index > -1) {
            this.teamMembers[index] = updatedMember;
          }
          this.filterMembers();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team member updated successfully'
          });
        },
        error: (error) => this.handleError('Failed to update team member', error)
      });
    } else {
      // Create new member
      this.teamMemberService.createTeamMember(member).subscribe({
        next: (newMember) => {
          this.teamMembers.push(newMember);
          this.filterMembers();
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team member created successfully'
          });
        },
        error: (error) => this.handleError('Failed to create team member', error)
      });
    }
  }

  deleteTeamMemberFromBackend(member: TeamMember): void {
    this.teamMemberService.deleteTeamMember(member.id).subscribe({
      next: () => {
        const index = this.teamMembers.findIndex(m => m.id === member.id);
        if (index > -1) {
          this.teamMembers.splice(index, 1);
        }
        this.filterMembers();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Team member deleted successfully'
        });
      },
      error: (error) => this.handleError('Failed to delete team member', error)
    });
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }
}
