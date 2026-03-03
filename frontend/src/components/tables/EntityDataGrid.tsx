import { DataGrid, DataGridProps } from '@mui/x-data-grid';
import { Card } from '@mui/material';

export const EntityDataGrid = (props: DataGridProps) => (
  <Card sx={{ p: 1 }}>
    <DataGrid
      autoHeight
      disableRowSelectionOnClick
      density="compact"
      pageSizeOptions={[5, 10, 25]}
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 10,
            page: 0,
          },
        },
      }}
      sx={{
        border: 0,
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#F8FBFF',
        },
      }}
      {...props}
    />
  </Card>
);
